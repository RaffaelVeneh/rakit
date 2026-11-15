<?php

namespace Tests\Feature;

use App\Models\OasTask;
use App\Support\ModuleQuizBank;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ModuleQuizzesTest extends TestCase
{
    use RefreshDatabase;

    public function test_oas_task_and_deadline_can_be_created_and_toggled(): void
    {
        $this->post(route('oas.tasks.store'), [
            'title' => 'Validasi backup harian DB',
            'assignee' => 'DBA Utama',
            'department' => 'Sistem Informasi',
            'due_date' => now()->addDays(3)->toDateString(),
            'priority' => 'urgent',
            'notes' => 'Periksa trigger logs.',
        ])->assertRedirect(route('oas'));

        $task = OasTask::query()->where('title', 'Validasi backup harian DB')->firstOrFail();
        $this->assertSame('open', $task->status);

        $this->patch(route('oas.tasks.toggle', $task))
            ->assertRedirect(route('oas'));

        $this->assertSame('done', $task->fresh()->status);
    }

    public function test_all_seven_quiz_chapters_have_ten_questions_and_grade_correctly(): void
    {
        $chapters = ModuleQuizBank::chapters();
        $this->assertCount(7, $chapters);

        foreach ($chapters as $meta) {
            $chapterKey = $meta['key'];
            $questions = ModuleQuizBank::questions($chapterKey);
            $this->assertCount(10, $questions);

            $this->get(route('quiz', ['bab' => $chapterKey]))
                ->assertStatus(200)
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Modules/Quiz')
                    ->where('chapter', $chapterKey)
                    ->has('questions', 10)
                );

            $answers = [];
            foreach ($questions as $q) {
                $answers[$q['id']] = $q['correct'];
            }

            $this->post(route('quiz.submit'), [
                'bab' => $chapterKey,
                'answers' => $answers,
            ])->assertStatus(200)
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Modules/QuizResult')
                    ->where('score', 10)
                    ->where('total', 10)
                    ->where('percentage', 100)
                    ->where('subject', $meta['subject'])
                );
        }
    }
}
