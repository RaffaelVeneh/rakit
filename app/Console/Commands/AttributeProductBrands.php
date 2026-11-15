<?php

namespace App\Console\Commands;

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttributeProductBrands extends Command
{
    /**
     * How many rows the change sample and the verdict listings may print.
     */
    private const SAMPLE_SIZE = 15;

    /**
     * Canonical brands and the leading name tokens that identify them.
     *
     * Derived from the product names that are actually present in the
     * catalogue. Tokens are matched case- and punctuation-insensitively
     * against the beginning of the product name, longest token first, so
     * compound vendors ("Western Digital", "Audio-Technica", "be quiet!",
     * "Lian Li") stay intact.
     *
     * NVIDIA is listed because the brand row exists, but no product name in
     * this catalogue starts with it: a graphics card is branded by its board
     * partner (ASUS, MSI, Gigabyte, ...) and must never be attributed to the
     * chip designer.
     *
     * @var list<array{name: string, slug: string, aliases: list<string>}>
     */
    private const BRANDS = [
        ['name' => 'Acer', 'slug' => 'acer', 'aliases' => ['acer']],
        ['name' => 'AMD', 'slug' => 'amd', 'aliases' => ['amd']],
        ['name' => 'Anker', 'slug' => 'anker', 'aliases' => ['anker']],
        ['name' => 'Apple', 'slug' => 'apple', 'aliases' => ['apple']],
        ['name' => 'Arctic', 'slug' => 'arctic', 'aliases' => ['arctic']],
        ['name' => 'ASUS', 'slug' => 'asus', 'aliases' => ['asus', 'asustek']],
        ['name' => 'Audio-Technica', 'slug' => 'audio-technica', 'aliases' => ['audio-technica', 'audio technica', 'audiotechnica']],
        ['name' => 'be quiet!', 'slug' => 'be-quiet', 'aliases' => ['be quiet!', 'be quiet', 'bequiet']],
        ['name' => 'Belkin', 'slug' => 'belkin', 'aliases' => ['belkin']],
        ['name' => 'BenQ', 'slug' => 'benq', 'aliases' => ['benq']],
        ['name' => 'Blackmagic Design', 'slug' => 'blackmagic-design', 'aliases' => ['blackmagic design', 'blackmagic']],
        ['name' => 'Bose', 'slug' => 'bose', 'aliases' => ['bose']],
        ['name' => 'CalDigit', 'slug' => 'caldigit', 'aliases' => ['caldigit', 'cal digit']],
        ['name' => 'Canon', 'slug' => 'canon', 'aliases' => ['canon']],
        ['name' => 'Corsair', 'slug' => 'corsair', 'aliases' => ['corsair']],
        ['name' => 'Crucial', 'slug' => 'crucial', 'aliases' => ['crucial']],
        ['name' => 'Dell', 'slug' => 'dell', 'aliases' => ['dell']],
        ['name' => 'DJI', 'slug' => 'dji', 'aliases' => ['dji']],
        ['name' => 'Elgato', 'slug' => 'elgato', 'aliases' => ['elgato']],
        ['name' => 'Fractal Design', 'slug' => 'fractal-design', 'aliases' => ['fractal design', 'fractal']],
        ['name' => 'Framework', 'slug' => 'framework', 'aliases' => ['framework']],
        ['name' => 'Fujifilm', 'slug' => 'fujifilm', 'aliases' => ['fujifilm', 'fuji film', 'fuji']],
        ['name' => 'G.Skill', 'slug' => 'g-skill', 'aliases' => ['g.skill', 'g skill', 'gskill']],
        ['name' => 'Gigabyte', 'slug' => 'gigabyte', 'aliases' => ['gigabyte', 'giga-byte']],
        ['name' => 'Google', 'slug' => 'google', 'aliases' => ['google']],
        ['name' => 'GoPro', 'slug' => 'gopro', 'aliases' => ['gopro', 'go pro']],
        ['name' => 'Honor', 'slug' => 'honor', 'aliases' => ['honor']],
        ['name' => 'HP', 'slug' => 'hp', 'aliases' => ['hp', 'hewlett-packard', 'hewlett packard']],
        ['name' => 'Huawei', 'slug' => 'huawei', 'aliases' => ['huawei']],
        ['name' => 'Infinix', 'slug' => 'infinix', 'aliases' => ['infinix']],
        ['name' => 'Insta360', 'slug' => 'insta360', 'aliases' => ['insta360', 'insta 360']],
        ['name' => 'Intel', 'slug' => 'intel', 'aliases' => ['intel']],
        ['name' => 'iQOO', 'slug' => 'iqoo', 'aliases' => ['iqoo', 'i qoo']],
        ['name' => 'Keychron', 'slug' => 'keychron', 'aliases' => ['keychron']],
        ['name' => 'Kingston', 'slug' => 'kingston', 'aliases' => ['kingston']],
        ['name' => 'Leica', 'slug' => 'leica', 'aliases' => ['leica']],
        ['name' => 'Lenovo', 'slug' => 'lenovo', 'aliases' => ['lenovo']],
        ['name' => 'LG', 'slug' => 'lg', 'aliases' => ['lg']],
        ['name' => 'Lian Li', 'slug' => 'lian-li', 'aliases' => ['lian li', 'lianli']],
        ['name' => 'Logitech', 'slug' => 'logitech', 'aliases' => ['logitech']],
        ['name' => 'Meizu', 'slug' => 'meizu', 'aliases' => ['meizu']],
        ['name' => 'Microsoft', 'slug' => 'microsoft', 'aliases' => ['microsoft']],
        ['name' => 'Motorola', 'slug' => 'motorola', 'aliases' => ['motorola', 'moto']],
        ['name' => 'MSI', 'slug' => 'msi', 'aliases' => ['msi', 'micro-star', 'micro star']],
        ['name' => 'Nikon', 'slug' => 'nikon', 'aliases' => ['nikon']],
        ['name' => 'Noctua', 'slug' => 'noctua', 'aliases' => ['noctua']],
        ['name' => 'Nothing', 'slug' => 'nothing', 'aliases' => ['nothing']],
        ['name' => 'NuPhy', 'slug' => 'nuphy', 'aliases' => ['nuphy']],
        ['name' => 'NVIDIA', 'slug' => 'nvidia', 'aliases' => ['nvidia']],
        ['name' => 'NZXT', 'slug' => 'nzxt', 'aliases' => ['nzxt']],
        ['name' => 'OnePlus', 'slug' => 'oneplus', 'aliases' => ['oneplus', 'one plus']],
        ['name' => 'OPPO', 'slug' => 'oppo', 'aliases' => ['oppo']],
        ['name' => 'Orbitkey', 'slug' => 'orbitkey', 'aliases' => ['orbitkey']],
        ['name' => 'Panasonic', 'slug' => 'panasonic', 'aliases' => ['panasonic']],
        ['name' => 'POCO', 'slug' => 'poco', 'aliases' => ['poco']],
        ['name' => 'Razer', 'slug' => 'razer', 'aliases' => ['razer']],
        ['name' => 'Realme', 'slug' => 'realme', 'aliases' => ['realme']],
        ['name' => 'Redmi', 'slug' => 'redmi', 'aliases' => ['redmi']],
        ['name' => 'Ricoh', 'slug' => 'ricoh', 'aliases' => ['ricoh']],
        ['name' => 'Rode', 'slug' => 'rode', 'aliases' => ['rode']],
        ['name' => 'Samsung', 'slug' => 'samsung', 'aliases' => ['samsung']],
        ['name' => 'Sapphire', 'slug' => 'sapphire', 'aliases' => ['sapphire']],
        ['name' => 'Seagate', 'slug' => 'seagate', 'aliases' => ['seagate']],
        ['name' => 'Seasonic', 'slug' => 'seasonic', 'aliases' => ['seasonic']],
        ['name' => 'Sennheiser', 'slug' => 'sennheiser', 'aliases' => ['sennheiser']],
        ['name' => 'Shure', 'slug' => 'shure', 'aliases' => ['shure']],
        ['name' => 'Sony', 'slug' => 'sony', 'aliases' => ['sony']],
        ['name' => 'SteelSeries', 'slug' => 'steelseries', 'aliases' => ['steelseries', 'steel series']],
        ['name' => 'Team Group', 'slug' => 'team-group', 'aliases' => ['team group', 'team t-force', 'teamgroup']],
        ['name' => 'Thermalright', 'slug' => 'thermalright', 'aliases' => ['thermalright']],
        ['name' => 'Ugreen', 'slug' => 'ugreen', 'aliases' => ['ugreen']],
        ['name' => 'Vivo', 'slug' => 'vivo', 'aliases' => ['vivo']],
        ['name' => 'Western Digital', 'slug' => 'western-digital', 'aliases' => ['western digital', 'wd']],
        ['name' => 'Xiaomi', 'slug' => 'xiaomi', 'aliases' => ['xiaomi']],
        ['name' => 'ZTE', 'slug' => 'zte', 'aliases' => ['zte']],
    ];

    /**
     * The name of the command.
     *
     * @var string
     */
    protected $signature = 'catalog:attribute-brands
                            {--dry-run : Report the attribution without writing to the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Attribute every product to the brand named at the start of its product name';

    /**
     * Normalised alias => brand definition, ordered longest alias first.
     *
     * @var array<string, array{name: string, slug: string, aliases: list<string>}>|null
     */
    private ?array $aliasIndex = null;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        /** @var array<string, int> $brandIdBySlug */
        $brandIdBySlug = [];

        /** @var array<string, int> $brandIdByName */
        $brandIdByName = [];

        /** @var array<int, string> $brandNameById */
        $brandNameById = [];

        foreach (Brand::query()->orderBy('id')->get() as $brand) {
            $brandIdBySlug[$this->normalise((string) $brand->slug)] = (int) $brand->id;
            $brandIdByName[$this->normalise((string) $brand->name)] = (int) $brand->id;
            $brandNameById[(int) $brand->id] = (string) $brand->name;
        }

        $existingBrandCount = count($brandNameById);

        $products = Product::query()->orderBy('id')->get();
        $productCount = $products->count();

        /** @var array<string, string> $createdBrands canonical slug => display name */
        $createdBrands = [];

        /** @var list<array{id: int, name: string, before: string, after: string}> $changes */
        $changes = [];

        /** @var list<array{id: int, name: string}> $undetermined */
        $undetermined = [];

        $fromName = 0;
        $fromDescription = 0;
        $assigned = 0;
        $cleared = 0;
        $unchanged = 0;
        $simulatedBrandId = 0;

        $attribute = function () use (
            $products,
            $dryRun,
            &$brandIdBySlug,
            &$brandIdByName,
            &$brandNameById,
            &$createdBrands,
            &$changes,
            &$undetermined,
            &$fromName,
            &$fromDescription,
            &$assigned,
            &$cleared,
            &$unchanged,
            &$simulatedBrandId,
        ): void {
            foreach ($products as $product) {
                $currentId = $product->brand_id === null ? null : (int) $product->brand_id;
                $definition = $this->matchLeadingBrand((string) $product->name);

                if ($definition !== null) {
                    $fromName++;
                } else {
                    $definition = $this->matchBrandInText((string) ($product->description ?? ''));

                    if ($definition !== null) {
                        $fromDescription++;
                    }
                }

                if ($definition === null) {
                    $undetermined[] = ['id' => (int) $product->id, 'name' => (string) $product->name];
                    $targetId = null;
                } else {
                    $targetId = $this->brandIdFor(
                        $definition,
                        $dryRun,
                        $brandIdBySlug,
                        $brandIdByName,
                        $brandNameById,
                        $createdBrands,
                        $simulatedBrandId,
                    );
                }

                if ($currentId === $targetId) {
                    $unchanged++;

                    continue;
                }

                if ($targetId === null) {
                    $cleared++;
                } else {
                    $assigned++;
                }

                $changes[] = [
                    'id' => (int) $product->id,
                    'name' => (string) $product->name,
                    'before' => $currentId === null ? '(null)' : ($brandNameById[$currentId] ?? '#'.$currentId),
                    'after' => $targetId === null ? '(null)' : ($brandNameById[$targetId] ?? '#'.$targetId),
                ];

                if (! $dryRun) {
                    $product->update(['brand_id' => $targetId]);
                }
            }
        };

        if ($dryRun) {
            $attribute();
        } else {
            DB::transaction($attribute);
        }

        $this->report(
            $dryRun,
            $productCount,
            $existingBrandCount,
            $fromName,
            $fromDescription,
            $undetermined,
            $assigned,
            $cleared,
            $unchanged,
            $createdBrands,
            $changes,
        );

        return self::SUCCESS;
    }

    /**
     * Resolve the brand row for a definition, creating the row when missing.
     *
     * Rows are matched on slug and on normalised name, so an existing brand is
     * always reused instead of being duplicated.
     *
     * @param  array{name: string, slug: string, aliases: list<string>}  $definition
     * @param  array<string, int>  $brandIdBySlug
     * @param  array<string, int>  $brandIdByName
     * @param  array<int, string>  $brandNameById
     * @param  array<string, string>  $createdBrands
     */
    private function brandIdFor(
        array $definition,
        bool $dryRun,
        array &$brandIdBySlug,
        array &$brandIdByName,
        array &$brandNameById,
        array &$createdBrands,
        int &$simulatedBrandId,
    ): int {
        $slugKey = $this->normalise($definition['slug']);

        if (isset($brandIdBySlug[$slugKey])) {
            return $brandIdBySlug[$slugKey];
        }

        $nameKey = $this->normalise($definition['name']);

        if (isset($brandIdByName[$nameKey])) {
            return $brandIdBySlug[$slugKey] = $brandIdByName[$nameKey];
        }

        if ($dryRun) {
            // Negative placeholder: never equal to a stored brand id, so the
            // dry run reports exactly the writes the real run would perform.
            $brandId = --$simulatedBrandId;
        } else {
            $brandId = (int) Brand::create([
                'name' => $definition['name'],
                'slug' => $definition['slug'],
            ])->id;
        }

        $brandIdBySlug[$slugKey] = $brandId;
        $brandIdByName[$nameKey] = $brandId;
        $brandNameById[$brandId] = $definition['name'];
        $createdBrands[$definition['slug']] = $definition['name'];

        return $brandId;
    }

    /**
     * Match the leading brand token of a product name.
     *
     * @return array{name: string, slug: string, aliases: list<string>}|null
     */
    private function matchLeadingBrand(string $name): ?array
    {
        $haystack = $this->normalise($name);

        foreach ($this->aliasIndex() as $alias => $definition) {
            if (! str_starts_with($haystack, $alias)) {
                continue;
            }

            $next = substr($haystack, strlen($alias), 1);

            if ($next === '' || $next === ' ') {
                return $definition;
            }
        }

        return null;
    }

    /**
     * Match the first brand token mentioned anywhere in a text.
     *
     * Only used as a fallback for products whose name carries no brand token.
     *
     * @return array{name: string, slug: string, aliases: list<string>}|null
     */
    private function matchBrandInText(string $text): ?array
    {
        $haystack = $this->normalise($text);

        if ($haystack === '') {
            return null;
        }

        $match = null;
        $matchPosition = PHP_INT_MAX;

        foreach ($this->aliasIndex() as $alias => $definition) {
            $position = strpos($haystack, $alias);

            while ($position !== false && ! $this->isWordMatch($haystack, $alias, $position)) {
                $position = strpos($haystack, $alias, $position + 1);
            }

            if ($position === false || $position >= $matchPosition) {
                continue;
            }

            $match = $definition;
            $matchPosition = $position;
        }

        return $match;
    }

    /**
     * Determine whether an alias occurs as a whole word at the given offset.
     */
    private function isWordMatch(string $haystack, string $alias, int $position): bool
    {
        $before = $position === 0 ? ' ' : substr($haystack, $position - 1, 1);
        $after = substr($haystack, $position + strlen($alias), 1);

        return $before === ' ' && ($after === '' || $after === ' ');
    }

    /**
     * Reduce a value to a comparable form: lower case, punctuation as spaces.
     */
    private function normalise(string $value): string
    {
        $collapsed = preg_replace('/[^\p{L}\p{N}]+/u', ' ', Str::lower($value)) ?? '';

        return trim($collapsed);
    }

    /**
     * Normalised aliases pointing at their brand, longest alias first.
     *
     * @return array<string, array{name: string, slug: string, aliases: list<string>}>
     */
    private function aliasIndex(): array
    {
        if ($this->aliasIndex !== null) {
            return $this->aliasIndex;
        }

        $index = [];

        foreach (self::BRANDS as $definition) {
            foreach ($definition['aliases'] as $alias) {
                $index[$this->normalise($alias)] = $definition;
            }
        }

        uksort($index, fn (string $first, string $second): int => strlen($second) <=> strlen($first));

        return $this->aliasIndex = $index;
    }

    /**
     * Print the run summary, the created brands and a sample of the changes.
     *
     * @param  list<array{id: int, name: string}>  $undetermined
     * @param  array<string, string>  $createdBrands
     * @param  list<array{id: int, name: string, before: string, after: string}>  $changes
     */
    private function report(
        bool $dryRun,
        int $productCount,
        int $existingBrandCount,
        int $fromName,
        int $fromDescription,
        array $undetermined,
        int $assigned,
        int $cleared,
        int $unchanged,
        array $createdBrands,
        array $changes,
    ): void {
        $undeterminedCount = count($undetermined);
        $createdCount = count($createdBrands);

        $this->newLine();
        $this->info($dryRun
            ? 'catalog:attribute-brands — DRY RUN, nothing was written'
            : 'catalog:attribute-brands — brand attribution applied');

        $this->table(['Metric', 'Value'], [
            ['Products scanned', $productCount],
            ['Brand rows before the run', $existingBrandCount],
            ['Brand determined from the product name', $fromName],
            ['Brand determined from the description only', $fromDescription],
            ['Brand could not be determined (brand_id null)', $undeterminedCount],
            [$dryRun ? 'Brand rows that would be created' : 'Brand rows created', $createdCount],
            [$dryRun ? 'Products that would get a brand' : 'Products given a brand', $assigned],
            [$dryRun ? 'Products that would be cleared to null' : 'Products cleared to null', $cleared],
            ['Products already correct (untouched)', $unchanged],
        ]);

        if ($createdBrands !== []) {
            $labels = [];

            foreach ($createdBrands as $slug => $name) {
                $labels[] = sprintf('%s (%s)', $this->escape($name), $slug);
            }

            $this->line($dryRun ? ' Brand rows that would be created:' : ' Brand rows created:');
            $this->line('   '.wordwrap(implode(', ', $labels), 110, PHP_EOL.'   '));
        }

        if ($changes !== []) {
            $sample = array_slice($changes, 0, self::SAMPLE_SIZE);

            $this->line(sprintf(' Sample of changes (%d shown of %d):', count($sample), count($changes)));
            $this->table(
                ['ID', 'Product', 'Before', 'After'],
                array_map(fn (array $change): array => [
                    '#'.$change['id'],
                    $this->escape($change['name']),
                    $this->escape($change['before']),
                    $this->escape($change['after']),
                ], $sample),
            );
        }

        if ($undetermined !== []) {
            $this->warn(sprintf(
                ' %d product(s) carry no brand token in their name or description; their brand_id is left null:',
                $undeterminedCount,
            ));

            foreach (array_slice($undetermined, 0, self::SAMPLE_SIZE) as $product) {
                $this->line(sprintf('   #%d %s', $product['id'], $this->escape($product['name'])));
            }

            if ($undeterminedCount > self::SAMPLE_SIZE) {
                $this->line(sprintf('   ... and %d more', $undeterminedCount - self::SAMPLE_SIZE));
            }
        }

        $unused = Brand::query()
            ->whereDoesntHave('products')
            ->orderBy('name')
            ->pluck('name')
            ->all();

        if ($unused !== []) {
            $this->line(sprintf(
                ' Brand rows without products %s: %s',
                $dryRun ? '(as currently stored)' : '(after this run)',
                $this->escape(implode(', ', $unused)),
            ));
        }

        $this->newLine();
    }

    /**
     * Escape console markup in values that come from the database.
     */
    private function escape(string $value): string
    {
        return str_replace(['<', '>'], ['\<', '\>'], $value);
    }
}
