<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SoftwareController extends Controller
{
    /**
     * BAB IV: Perangkat Lunak Komputer untuk Sistem Informasi
     */
    public function index()
    {
        // Data dari tabel-tabel SQL Bab 4 (PDF 1).
        //
        // The credential columns are left out of the select on purpose. These rows
        // are handed to the page as props, so ->get() would ship every seeded
        // plaintext password to the browser in the Inertia payload. The sheet only
        // ever printed eight dots for them anyway; the value never needs to leave
        // the server.
        $adminColumns = ['admin_id', 'admin_name', 'admin_email', 'created_at', 'updated_at'];
        $userColumns = ['user_id', 'first_name', 'last_name', 'email', 'mobile', 'address1', 'address2', 'created_at', 'updated_at'];

        $adminInfo = DB::table('admin_info')->select($adminColumns)->get();
        $emailInfo = DB::table('email_info')->latest()->take(5)->get();
        $userInfo = DB::table('user_info')->select($userColumns)->latest()->take(5)->get();
        $userInfoBackup = DB::table('user_info_backup')->select($userColumns)->latest()->take(5)->get();

        $questions = $this->getQuestions();

        return Inertia::render('Tech/Software', [
            'adminInfo' => $adminInfo,
            'emailInfo' => $emailInfo,
            'userInfo' => $userInfo,
            'userInfoBackup' => $userInfoBackup,
            'questions' => $questions,
        ]);
    }

    /**
     * Run Stored Procedure `getcat(cid)` from PDF 1
     */
    public function runProcedure(Request $request)
    {
        $categoryId = $request->input('category_id', 1);

        // Execute Stored Procedure
        $result = DB::select('CALL getcat(?)', [$categoryId]);

        return response()->json([
            'status' => 'success',
            'procedure_called' => "CALL getcat({$categoryId})",
            'data' => $result,
        ]);
    }

    /**
     * Submit Latihan Soal Bab 4
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

        return Inertia::render('Modules/QuizResult', compact('score', 'total', 'percentage', 'details') + ['subject' => 'Latihan Bab IV — Perangkat Lunak']);
    }

    /**
     * 10 Latihan Soal BAB IV (Sesuai PDF Bab 4 Halaman 9-10)
     */
    private function getQuestions()
    {
        return [
            [
                'id' => 1,
                'question' => 'Program yang berisi perintah atau instruksi yang diberikan kepada komputer dalam kode biner (binary: 0 dan 1) dikategorisasikan sebagai...',
                'options' => [
                    'a' => 'Bahasa Tingkat Tinggi',
                    'b' => 'Bahasa Tingkat Rendah (Machine Language)',
                    'c' => 'Bahasa Tingkat Menengah',
                    'd' => 'Algoritma',
                    'e' => 'Bahasa Mnemonic',
                ],
                'correct' => 'b',
                'explanation' => 'Machine language (bahasa mesin/1st generation language) adalah bahasa tingkat rendah yang terdiri dari serangkaian digit biner nol dan satu yang dimengerti langsung oleh CPU.',
            ],
            [
                'id' => 2,
                'question' => 'Bahasa program yang berisi instruksi yang diberikan kepada komputer dalam kode mnemonic (seperti ADD, MOV, SUB) adalah...',
                'options' => [
                    'a' => 'Bahasa Tingkat Tinggi',
                    'b' => 'Bahasa Tingkat Rendah / Menengah (Assembly Language)',
                    'c' => 'Bahasa Tingkat Menengah',
                    'd' => 'Kode Mesin',
                    'e' => 'Natural Language',
                ],
                'correct' => 'b',
                'explanation' => 'Bahasa assembly (2nd generation language) menggantikan kode biner dengan mnemonik (singkatan memori seperti ADD, MOV, SUB) untuk mempermudah pemrogram.',
            ],
            [
                'id' => 3,
                'question' => 'Bahasa yang dekat dengan bahasa alamiah atau bahasa yang dimengerti manusia dan mudah untuk ditulis, di-debug, dan dipelihara dikenal sebagai...',
                'options' => [
                    'a' => 'Bahasa Tingkat Tinggi (High-Level Language / 3GL & 4GL)',
                    'b' => 'Bahasa Tingkat Rendah',
                    'c' => 'Algoritma',
                    'd' => 'Kode Mesin',
                    'e' => 'Bahasa Mnemonic',
                ],
                'correct' => 'a',
                'explanation' => 'High-level language (3GL seperti C, Pascal, Java, PHP dan 4GL) menggunakan struktur kalimat mendekati bahasa manusia (bahasa Inggris) sehingga mudah dipelajari dan di-maintain.',
            ],
            [
                'id' => 4,
                'question' => 'Manakah dari berikut ini yang BUKAN merupakan bahasa pemrograman tingkat tinggi?',
                'options' => [
                    'a' => 'Assembly',
                    'b' => 'C++',
                    'c' => 'Java',
                    'd' => 'Python',
                    'e' => 'PHP',
                ],
                'correct' => 'a',
                'explanation' => 'Assembly adalah bahasa generasi kedua (2GL / low-level mnemonic language), sedangkan C++, Java, Python, dan PHP adalah bahasa tingkat tinggi (high-level languages).',
            ],
            [
                'id' => 5,
                'question' => 'Bahasa yang berhubungan erat langsung dengan arsitektur dan perangkat keras komputer tertentu dikenal sebagai...',
                'options' => [
                    'a' => 'Bahasa Tingkat Tinggi',
                    'b' => 'Bahasa Tingkat Rendah (Machine & Assembly)',
                    'c' => 'Bahasa Tingkat Menengah',
                    'd' => 'Bahasa Kompleks',
                    'e' => 'Bahasa Mnemonic',
                ],
                'correct' => 'b',
                'explanation' => 'Bahasa tingkat rendah (machine language dan assembly) terikat secara spesifik dengan register dan arsitektur prosesor fisik tertentu.',
            ],
            [
                'id' => 6,
                'question' => 'Dua kategori utama dari bahasa tingkat rendah adalah...',
                'options' => [
                    'a' => 'Machine Code dan Assembly',
                    'b' => 'Machine Code dan algorithms',
                    'c' => 'Assembly dan algorithms',
                    'd' => 'Algorithms dan binary',
                    'e' => 'Machine Code dan binary',
                ],
                'correct' => 'a',
                'explanation' => 'Bahasa tingkat rendah terbagi menjadi generasi pertama (1GL: Machine Code biner) dan generasi kedua (2GL: Assembly language).',
            ],
            [
                'id' => 7,
                'question' => 'Apa nama perangkat lunak yang digunakan untuk menerjemahkan program bahasa assembly menjadi kode mesin?',
                'options' => [
                    'a' => 'Assembler',
                    'b' => 'Interpreter',
                    'c' => 'Compiler',
                    'd' => 'Translator',
                    'e' => 'Connector',
                ],
                'correct' => 'a',
                'explanation' => 'Assembler adalah program khusus penerjemah yang mengonversi kode mnemonik assembly menjadi bahasa mesin (binary object code) yang dapat dieksekusi CPU.',
            ],
            [
                'id' => 8,
                'question' => 'Manakah dari perintah berikut yang TIDAK ditemukan dalam instruksi dasar bahasa assembly?',
                'options' => [
                    'a' => 'MOV (Move data)',
                    'b' => 'DEC (Decrement)',
                    'c' => 'ADD (Addition)',
                    'd' => 'SUB (Subtraction)',
                    'e' => 'SORT',
                ],
                'correct' => 'e',
                'explanation' => 'Perintah assembly bekerja pada level register CPU seperti MOV, ADD, SUB, DEC, JMP. Perintah SORT adalah operasi tingkat tinggi atau algoritma tingkat aplikasi, bukan instruksi CPU assembly.',
            ],
            [
                'id' => 9,
                'question' => 'Java, Python, PHP, dan C++ adalah contoh dari...',
                'options' => [
                    'a' => 'bahasa tingkat rendah',
                    'b' => 'bahasa tingkat menengah',
                    'c' => 'bahasa seni grafis',
                    'd' => 'bahasa tingkat tinggi (High-level languages)',
                    'e' => 'bahasa mesin',
                ],
                'correct' => 'd',
                'explanation' => 'Java, Python, PHP, dan C++ adalah bahasa pemrograman tingkat tinggi yang mendukung pemrograman berorientasi objek (OOP) dan portabel antar platform.',
            ],
            [
                'id' => 10,
                'question' => 'Perangkat lunak yang mampu mengeksekusi kode program baris demi baris sambil mengikuti logikanya lalu menerjemahkannya ke dalam bahasa mesin secara langsung disebut...',
                'options' => [
                    'a' => 'Assembler',
                    'b' => 'Interpreter',
                    'c' => 'Compiler',
                    'd' => 'Translator',
                    'e' => 'Connector',
                ],
                'correct' => 'b',
                'explanation' => 'Interpreter mengeksekusi dan menerjemahkan baris demi baris secara langsung (orally/realtime), berbeda dengan Compiler yang menerjemahkan seluruh file menjadi kesatuan file binary sebelum dijalankan.',
            ],
        ];
    }
}
