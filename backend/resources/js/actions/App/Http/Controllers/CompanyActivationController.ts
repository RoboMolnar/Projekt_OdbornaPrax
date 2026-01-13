import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
export const activate = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: activate.url(args, options),
    method: 'get',
})

activate.definition = {
    methods: ["get","head"],
    url: '/company/activate/{user}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
activate.url = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'user_id' in args) {
            args = { user: args.user_id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.user_id
                : args.user,
                }

    return activate.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
activate.get = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: activate.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
activate.head = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: activate.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
    const activateForm = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: activate.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
        activateForm.get = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: activate.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CompanyActivationController::activate
 * @see app/Http/Controllers/CompanyActivationController.php:10
 * @route '/company/activate/{user}'
 */
        activateForm.head = (args: { user: number | { user_id: number } } | [user: number | { user_id: number } ] | number | { user_id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: activate.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    activate.form = activateForm
const CompanyActivationController = { activate }

export default CompanyActivationController