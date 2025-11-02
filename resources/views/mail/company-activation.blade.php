@component('mail::message')
# Váš firemný účet bol vytvorený

Dobrý deň, {{ $user->first_name }} {{ $user->last_name }},

**Prihlasovací e-mail:** {{ $user->email }}  
**Dočasné heslo:** `{{ $plainPassword }}`

Pred prvým prihlásením prosím **aktivujte účet** (platnosť odkazu 72 hodín):

@component('mail::button', ['url' => $activationUrl])
Aktivovať účet
@endcomponent

Po prihlásení budete vyzvaní na zmenu hesla.
@endcomponent
