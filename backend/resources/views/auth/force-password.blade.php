<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zmena hesla</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-50 text-slate-900">
  <div class="max-w-md mx-auto mt-16">
    <div class="bg-white rounded-2xl shadow p-6">
      <h1 class="text-xl font-semibold mb-2 text-center">Zmena hesla</h1>
      <p class="text-sm text-slate-600 mb-6 text-center">
        Z bezpečnostných dôvodov si prosím nastavte nové heslo.
      </p>

      <form method="POST" action="{{ route('password.force.update') }}" class="space-y-4">
        @csrf
        <div>
          <label class="block text-sm font-medium mb-1">Nové heslo</label>
          <input name="password" type="password" required
                 class="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-500">
          @error('password') <p class="text-red-600 text-sm mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Potvrdenie hesla</label>
          <input name="password_confirmation" type="password" required
                 class="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-500">
        </div>

        <button type="submit"
                class="w-full bg-indigo-600 text-white rounded-lg p-2.5 font-medium hover:bg-indigo-700 transition">
          Uložiť nové heslo
        </button>
      </form>
    </div>
  </div>
</body>
</html>
