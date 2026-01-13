import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::custom
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:56
 * @route '/auth/logout'
 */
export const custom = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: custom.url(options),
    method: 'post',
})

custom.definition = {
    methods: ["post"],
    url: '/auth/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::custom
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:56
 * @route '/auth/logout'
 */
custom.url = (options?: RouteQueryOptions) => {
    return custom.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::custom
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:56
 * @route '/auth/logout'
 */
custom.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: custom.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::custom
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:56
 * @route '/auth/logout'
 */
    const customForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: custom.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::custom
 * @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:56
 * @route '/auth/logout'
 */
        customForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: custom.url(options),
            method: 'post',
        })
    
    custom.form = customForm
const logout = {
    custom: Object.assign(custom, custom),
}

export default logout