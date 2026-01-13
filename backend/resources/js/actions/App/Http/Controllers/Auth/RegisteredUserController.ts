import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/register',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::create
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:19
 * @route '/register'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::store
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:29
 * @route '/register'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/register',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::store
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:29
 * @route '/register'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::store
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:29
 * @route '/register'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::store
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:29
 * @route '/register'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::store
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:29
 * @route '/register'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeStudent
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
export const storeStudent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeStudent.url(options),
    method: 'post',
})

storeStudent.definition = {
    methods: ["post"],
    url: '/register-student',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeStudent
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
storeStudent.url = (options?: RouteQueryOptions) => {
    return storeStudent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeStudent
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
storeStudent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeStudent.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeStudent
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
    const storeStudentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeStudent.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeStudent
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
        storeStudentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeStudent.url(options),
            method: 'post',
        })
    
    storeStudent.form = storeStudentForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeCompany
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
export const storeCompany = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCompany.url(options),
    method: 'post',
})

storeCompany.definition = {
    methods: ["post"],
    url: '/register-company',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeCompany
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
storeCompany.url = (options?: RouteQueryOptions) => {
    return storeCompany.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeCompany
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
storeCompany.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCompany.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeCompany
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
    const storeCompanyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeCompany.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::storeCompany
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
        storeCompanyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeCompany.url(options),
            method: 'post',
        })
    
    storeCompany.form = storeCompanyForm
const RegisteredUserController = { create, store, storeStudent, storeCompany }

export default RegisteredUserController