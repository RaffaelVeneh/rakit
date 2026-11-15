<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Replace generic filler photography in the catalogue.
 *
 * The seeded catalogue carries a small number of stock photographs that were
 * handed out without regard for what the row actually is — the same picture of a
 * coffee cup, an open book and a pair of glasses was standing in for an NVMe SSD,
 * a CPU cooler and a monitor light. On a sheet whose whole argument is that its
 * figures can be checked, a photograph that contradicts the row undoes the page.
 *
 * The rule is data-driven rather than a hand-kept blacklist: a genuine product
 * photograph stays inside its group, so **an image used by products in more than
 * one group is a filler**, whatever it depicts. Each affected row is then given
 * the most-used image within its own group, which is by construction a photograph
 * the catalogue already uses for that kind of part. Re-running is inert once the
 * fillers are gone, and a later import that reintroduces one is corrected by the
 * same run.
 *
 * This does not create assets and does not pretend to. PRODUCT.md records that
 * every photograph here is a placeholder to be replaced with owned catalogue
 * photography; this command only stops the placeholders from lying about the row.
 */
class RepairCatalogueImages extends Command
{
    protected $signature = 'catalog:repair-images
                            {--dry-run : Report what would change without writing}
                            {--min-rows=2 : How many rows must share an image before it can count as a filler}
                            {--min-groups=2 : How many distinct groups must share it}';

    protected $description = 'Replace cross-group filler photographs with a photograph from the product\'s own group';

    public function handle(): int
    {
        $minRows = max(2, (int) $this->option('min-rows'));
        $minGroups = max(2, (int) $this->option('min-groups'));
        $dryRun = (bool) $this->option('dry-run');

        $fillers = $this->fillers($minRows, $minGroups);

        if ($fillers === []) {
            $this->info('No cross-group filler images found. Nothing to repair.');

            return self::SUCCESS;
        }

        $this->line(sprintf(
            'Found %d filler image%s used across %s:',
            count($fillers),
            count($fillers) === 1 ? '' : 's',
            count($fillers) === 1 ? 'more than one group' : 'more than one group',
        ));

        foreach ($fillers as $image => $row) {
            $this->line(sprintf(
                '  %s — %d rows in %d groups',
                $this->shorten($image),
                $row->row_count,
                $row->group_count,
            ));
        }

        $replacements = $this->replacementFor($fillers);

        if ($replacements === []) {
            $this->warn('No in-group replacement available; leaving the catalogue untouched.');

            return self::SUCCESS;
        }

        $changed = 0;

        foreach ($replacements as $groupId => $image) {
            $affected = Product::where('category_id', $groupId)
                ->whereIn('image', array_keys($fillers))
                ->get();

            foreach ($affected as $product) {
                $this->line(sprintf(
                    '  %s  %s → %s',
                    str_pad((string) $product->id, 5, ' ', STR_PAD_LEFT),
                    $this->shorten($product->image),
                    $this->shorten($image),
                ));

                if (! $dryRun) {
                    $product->forceFill(['image' => $image])->save();
                }

                $changed++;
            }
        }

        $this->newLine();
        $this->info(sprintf(
            '%s %d row%s.',
            $dryRun ? 'Would repair' : 'Repaired',
            $changed,
            $changed === 1 ? '' : 's',
        ));

        if ($dryRun) {
            $this->comment('Dry run: nothing was written.');
        }

        return self::SUCCESS;
    }

    /**
     * Images shared by more than one group, with how widely each is used.
     *
     * @return array<string, object{row_count: int, group_count: int}>
     */
    private function fillers(int $minRows, int $minGroups): array
    {
        return DB::table('products')
            ->selectRaw('image, COUNT(*) as row_count, COUNT(DISTINCT category_id) as group_count')
            ->whereRaw("image is not null and image <> ''")
            ->groupBy('image')
            ->havingRaw('COUNT(DISTINCT category_id) >= ?', [$minGroups])
            ->havingRaw('COUNT(*) >= ?', [$minRows])
            ->orderByRaw('COUNT(*) desc')
            ->get()
            ->keyBy('image')
            ->all();
    }

    /**
     * The most-used in-group photograph for every group that contains a filler.
     *
     * @param  array<string, object{row_count: int, group_count: int}>  $fillers
     * @return array<int, string>
     */
    private function replacementFor(array $fillers): array
    {
        $replacement = [];

        $groupIds = Product::whereIn('image', array_keys($fillers))
            ->distinct()
            ->pluck('category_id');

        foreach ($groupIds as $groupId) {
            $candidate = DB::table('products')
                ->selectRaw('image, COUNT(*) as row_count')
                ->where('category_id', $groupId)
                ->whereRaw("image is not null and image <> ''")
                ->whereNotIn('image', array_keys($fillers))
                ->groupBy('image')
                ->orderByRaw('COUNT(*) desc')
                ->orderBy('image')
                ->value('image');

            if ($candidate) {
                $replacement[(int) $groupId] = $candidate;
            }
        }

        return $replacement;
    }

    /** Print enough of a URL to recognise it without wrapping the terminal. */
    private function shorten(?string $image): string
    {
        $image = (string) $image;

        if (preg_match('#/photo-([a-z0-9\-]+)\?#i', $image, $matches)) {
            return 'photo-'.$matches[1];
        }

        return strlen($image) > 46 ? substr($image, 0, 43).'…' : $image;
    }
}
