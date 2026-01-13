<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\InternshipState;
use App\Models\InternshipStateChange;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExternalIntegrationController extends Controller
{
    private function resolveActor(Request $request): User
    {
        /** @var User|null $user */
        $user = $request->user();

        // ak je request autentifikovaný, audituj presného používateľa
        if ($user) {
            return $user;
        }

        // fallback: fixný externý systém user (z configu)
        $actorId = (int) config('services.external_system.user_id', 0);
        if ($actorId <= 0) {
            abort(401, 'Neprihlasený používateľ (chýba external system user_id).');
        }

        $actor = User::query()->where('user_id', $actorId)->first();
        if (!$actor) {
            abort(401, 'Neprihlasený používateľ (external system účet neexistuje).');
        }

        return $actor;
    }

    public function markDefended(Request $request, $internship)
    {
        $actor = $this->resolveActor($request);

        $item = Internship::query()
            ->with('state')
            ->where('internship_id', $internship)
            ->first();

        if (!$item) {
            abort(404, 'Prax sa nenašla.');
        }

        $current = $item->state?->internship_state_name;

        if ($current === 'Obhájená') {
            return response()->json(['ok' => true, 'status' => 'Obhájená']);
        }

        if ($current !== 'Schválená') {
            return response()->json([
                'ok' => false,
                'message' => 'Zmeniť stav možno len zo stavu Schválená.',
            ], 422);
        }

        $toState = InternshipState::query()
            ->where('internship_state_name', 'Obhájená')
            ->first();

        if (!$toState) {
            return response()->json([
                'ok' => false,
                'message' => 'Stav "Obhájená" neexistuje.',
            ], 422);
        }

        $fromStateId = (int) $item->state_id;
        $toStateId   = (int) $toState->internship_state_id;

        if ($fromStateId === $toStateId) {
            return response()->json(['ok' => true, 'status' => 'Obhájená']);
        }

        DB::transaction(function () use ($item, $fromStateId, $toStateId, $actor) {
            $item->state_id = $toStateId;
            $item->save();

            InternshipStateChange::query()->create([
                'internship_id'      => (int) ($item->internship_id ?? $item->id),
                'from_state_id'      => $fromStateId,
                'to_state_id'        => $toStateId,
                'changed_by_user_id' => (int) ($actor->user_id ?? $actor->getKey()),
                'note'               => 'external-system',
                'changed_at'         => now(),
            ]);
        });

        return response()->json(['ok' => true, 'status' => 'Obhájená']);
    }
}
