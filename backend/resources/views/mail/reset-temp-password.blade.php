@component('mail::message')
# Obnova hesla – Portál praxe

Dobrý deň,

požiadali ste o obnovu hesla. Nižšie je vaše **dočasné heslo**:

**Dočasné heslo:** {{ $plainPassword }}

Kliknite na tlačidlo a zadajte dočasné heslo spolu s novým heslom:

@component('mail::button', ['url' => rtrim(env('FRONTEND_URL', config('app.url')), '/') . '/reset-password?email=' . urlencode($user->email)])
Nastaviť nové heslo
@endcomponent

Ak ste o obnovu hesla nežiadali, môžete tento e-mail ignorovať.

S pozdravom,  
**Portál praxe**
@endcomponent
