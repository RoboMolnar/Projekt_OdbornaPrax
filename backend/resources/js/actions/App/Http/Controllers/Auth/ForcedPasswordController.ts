import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
export const form = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})

form.definition = {
    methods: ["get","head"],
    url: '/force-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
form.url = (options?: RouteQueryOptions) => {
    return form.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
form.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: form.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
form.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: form.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
    const formForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: form.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
        formForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: form.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::form
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:12
 * @route '/force-password'
 */
        formForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: form.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    form.form = formForm
/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::update
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:17
 * @route '/force-password'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/force-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::update
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:17
 * @route '/force-password'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::update
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:17
 * @route '/force-password'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::update
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:17
 * @route '/force-password'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\ForcedPasswordController::update
 * @see app/Http/Controllers/Auth/ForcedPasswordController.php:17
 * @route '/force-password'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
const ForcedPasswordController = { form, update }

export default ForcedPasswordController