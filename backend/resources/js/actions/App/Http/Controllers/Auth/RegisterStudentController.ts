import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::store
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/register/student',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::store
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::store
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisterStudentController::store
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisterStudentController::store
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const RegisterStudentController = { store }

export default RegisterStudentController