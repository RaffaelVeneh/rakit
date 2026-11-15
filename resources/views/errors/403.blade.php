@extends('errors.layout')

@section('code', '403')
@section('title', 'Konsol ini bukan untuk Anda')
@section('body', 'Halaman yang Anda minta adalah konsol kendali, dan akun Anda bukan administrator. Masuk dengan akun administrator untuk membukanya.')

@section('actions')
    <a class="stamp" href="/login">Masuk sebagai administrator</a>
@endsection