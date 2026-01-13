import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::store
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/register/company',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::store
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::store
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::store
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::store
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const RegisterCompanyController = { store }

export default RegisterCompanyController