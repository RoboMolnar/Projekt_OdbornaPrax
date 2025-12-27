@component('mail::message')
# Vitajte v Portáli odbornej praxe

Dobrý deň, {{ $user->first_name }} {{ $user->last_name }},

váš účet bol úspešne vytvorený.

**Prihlasovací e-mail:** {{ $user->email }}  
**Dočasné heslo:** {{ $plainPassword }}

Po prihlásení budete vyzvaní na **zmenu hesla**.

@component('mail::button', ['url' => rtrim(env('FRONTEND_URL', config('app.url')), '/') . '/login'])
Prejsť na prihlásenie
@endcomponent

Ak ste o účet nežiadali, ignorujte tento e-mail.

S pozdravom,  
**Tím Portálu odbornej praxe**
@endcomponent
