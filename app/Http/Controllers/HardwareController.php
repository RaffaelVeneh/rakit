<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HardwareController extends Controller
{
    /**
     * Bab 3: Perangkat Keras Sistem - Dashboard & Interactive Lab
     */
    public function index()
    {
        // Fetch hardware related products.
        // The category relation is eager-loaded because the sheet derives each
        // part number from the real category name; without it the code would fall
        // back to a generic group and print a wrong number.
        $hardwareProducts = Product::with('category')
            ->whereHas('category', function ($q) {
                $q->whereIn('slug', ['laptops', 'hardware-pc', 'accessories']);
            })
            ->take(6)
            ->get();

        $questions = $this->getQuestions();

        return Inertia::render('Tech/Hardware', [
            'hardwareProducts' => $hardwareProducts,
            'questions' => $questions,
        ]);
    }

    /**
     * Submit Latihan Soal Bab 3
     */
    public function submitQuiz(Request $request)
    {
        $questions = $this->getQuestions();
        $answers = $request->input('answers', []);

        $score = 0;
        $total = count($questions);
        $details = [];

        foreach ($questions as $q) {
            $userAns = $answers[$q['id']] ?? null;
            $isCorrect = ($userAns === $q['correct']);
            if ($isCorrect) {
                $score++;
            }

            $details[] = [
                'id' => $q['id'],
                'question' => $q['question'],
                'options' => $q['options'],
                'user_answer' => $userAns,
                'correct_answer' => $q['correct'],
                'is_correct' => $isCorrect,
                'explanation' => $q['explanation'],
            ];
        }

        $percentage = round(($score / $total) * 100);

        return Inertia::render('Modules/QuizResult', compact('score', 'total', 'percentage', 'details') + ['subject' => 'Latihan Bab III — Perangkat Keras']);
    }

    /**
     * 10 Latihan Soal BAB III (Sesuai PDF Bab 3 Halaman 10-12)
     */
    private function getQuestions()
    {
        return [
            [
                'id' => 1,
                'question' => 'Storage / Penyimpanan yang tetap menyimpan data setelah komputer dimatikan disebut...',
                'options' => [
                    'a' => 'Volatile storage',
                    'b' => 'Non-volatile storage',
                    'c' => 'Sequential storage',
                    'd' => 'Direct storage',
                ],
                'correct' => 'b',
                'explanation' => 'Non-volatile storage (seperti ROM, Hard Disk, SSD) retains data even when power is turned off, sedangkan volatile storage (RAM) akan kehilangan data saat daya mati.',
            ],
            [
                'id' => 2,
                'question' => 'Memori permanen yang menampung data dan instruksi untuk menjalankan komputer dan tidak terhapus datanya setelah dimatikan adalah...',
                'options' => [
                    'a' => 'Network interface card',
                    'b' => 'CPU',
                    'c' => 'RAM',
                    'd' => 'ROM',
                ],
                'correct' => 'd',
                'explanation' => 'ROM (Read Only Memory) adalah memori non-volatile permanen yang menyimpan instruksi awal pabrik seperti bootstrap loader.',
            ],
            [
                'id' => 3,
                'question' => 'Manakah dari memori berikut yang harus disegarkan (refreshed) berkali-kali per detik?',
                'options' => [
                    'a' => 'EPROM',
                    'b' => 'ROM',
                    'c' => 'Static RAM (SRAM)',
                    'd' => 'Dynamic RAM (DRAM)',
                ],
                'correct' => 'd',
                'explanation' => 'DRAM (Dynamic RAM) menggunakan kapasitor yang secara konstan mengalami kebocoran muatan listrik, sehingga sirkuit harus melakukan refresh ribuan kali per detik.',
            ],
            [
                'id' => 4,
                'question' => 'Central Processing Unit (CPU) pada dasarnya terdiri dari...',
                'options' => [
                    'a' => 'Input, output dan processing',
                    'b' => 'Control unit, primary storage, dan secondary storage',
                    'c' => 'Control unit, arithmetic-logic unit (ALU), dan primary storage/registers',
                    'd' => 'Control unit, processing, dan primary storage',
                ],
                'correct' => 'c',
                'explanation' => 'Arsitektur CPU terdiri dari ALU (operasi aritmatika dan logika), Control Unit (CU - pengatur instruksi), dan unit penyimpanan primer/register.',
            ],
            [
                'id' => 5,
                'question' => 'Memori permanen yang menampung instruksi untuk menghidupkan komputer (bootstrap loader) adalah...',
                'options' => [
                    'a' => 'Network interface card',
                    'b' => 'CPU',
                    'c' => 'RAM',
                    'd' => 'ROM',
                ],
                'correct' => 'd',
                'explanation' => 'ROM menyimpan program bootstrap loader yang dijalankan pertama kali saat daya dihidupkan untuk memuat sistem operasi.',
            ],
            [
                'id' => 6,
                'question' => 'Apakah jenis komputer dengan kemampuan dan kapasitas terbesar?',
                'options' => [
                    'a' => 'Main-Frame Computer',
                    'b' => 'Mini Computers',
                    'c' => 'Micro Computers',
                    'd' => 'Super Computers',
                ],
                'correct' => 'd',
                'explanation' => 'Super Computer merupakan kelas komputer tercepat dan terbesar di dunia yang menangani kalkulasi saintifik dan simulasi skala raksasa.',
            ],
            [
                'id' => 7,
                'question' => 'Manakah dari berikut ini yang merupakan unit data dasar pada perangkat penyimpanan eksternal (external storage)?',
                'options' => [
                    'a' => 'Bits',
                    'b' => 'Bytes',
                    'c' => 'Hertz',
                    'd' => 'Clock cycles',
                ],
                'correct' => 'b',
                'explanation' => 'Byte (8 bit) adalah unit dasar penampungan karakter dan pengukuran kapasitas file pada media penyimpanan (KB, MB, GB, TB).',
            ],
            [
                'id' => 8,
                'question' => 'Resolusi standar Video Graphics Array (VGA) yang diperkenalkan oleh IBM adalah...',
                'options' => [
                    'a' => '640x480 pixel',
                    'b' => '670x580 pixel',
                    'c' => '1280x1024 pixel',
                    'd' => '800x600 pixel',
                ],
                'correct' => 'a',
                'explanation' => 'Standar VGA yang dikembangkan oleh IBM pada tahun 1987 menyediakan resolusi 640 x 480 pixel dengan refresh rate 60 Hz.',
            ],
            [
                'id' => 9,
                'question' => 'Perangkat komputer di mana data diwakili oleh kuantitas variabel fisik kontinu (seperti suhu, tekanan, tegangan) disebut...',
                'options' => [
                    'a' => 'Computer analog',
                    'b' => 'Perangkat komputer',
                    'c' => 'Program sistem',
                    'd' => 'Computer digital',
                ],
                'correct' => 'a',
                'explanation' => 'Komputer analog memproses data kuantitas fisik kontinu (seperti aliran cairan, tekanan, tegangan) secara instan tanpa konversi digital diskrit.',
            ],
            [
                'id' => 10,
                'question' => 'Periferal yang digunakan untuk menerima data dan mengirimkannya ke unit pemroses disebut...',
                'options' => [
                    'a' => 'Perangkat input',
                    'b' => 'Perangkat output',
                    'c' => 'Perangkat data',
                    'd' => 'Perangkat processing',
                ],
                'correct' => 'a',
                'explanation' => 'Perangkat input (seperti keyboard, mouse, barcode reader, scanner) bertugas membawa informasi dari luar ke dalam sistem komputer.',
            ],
        ];
    }
}
