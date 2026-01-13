import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::student
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
export const student = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: student.url(options),
    method: 'post',
})

student.definition = {
    methods: ["post"],
    url: '/register/student',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::student
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
student.url = (options?: RouteQueryOptions) => {
    return student.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisterStudentController::student
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
student.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: student.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisterStudentController::student
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
    const studentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: student.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisterStudentController::student
 * @see app/Http/Controllers/Auth/RegisterStudentController.php:15
 * @route '/register/student'
 */
        studentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: student.url(options),
            method: 'post',
        })
    
    student.form = studentForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::student
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
export const student = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: student.url(options),
    method: 'post',
})

student.definition = {
    methods: ["post"],
    url: '/register-student',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::student
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
student.url = (options?: RouteQueryOptions) => {
    return student.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::student
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
student.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: student.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::student
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
    const studentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: student.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::student
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:94
 * @route '/register-student'
 */
        studentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: student.url(options),
            method: 'post',
        })
    
    student.form = studentForm
/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::company
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
export const company = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: company.url(options),
    method: 'post',
})

company.definition = {
    methods: ["post"],
    url: '/register/company',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::company
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
company.url = (options?: RouteQueryOptions) => {
    return company.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::company
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
company.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: company.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::company
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
    const companyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: company.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisterCompanyController::company
 * @see app/Http/Controllers/Auth/RegisterCompanyController.php:16
 * @route '/register/company'
 */
        companyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: company.url(options),
            method: 'post',
        })
    
    company.form = companyForm
/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::company
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
export const company = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: company.url(options),
    method: 'post',
})

company.definition = {
    methods: ["post"],
    url: '/register-company',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::company
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
company.url = (options?: RouteQueryOptions) => {
    return company.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\RegisteredUserController::company
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
company.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: company.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::company
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
    const companyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: company.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\RegisteredUserController::company
 * @see app/Http/Controllers/Auth/RegisteredUserController.php:85
 * @route '/register-company'
 */
        companyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: company.url(options),
            method: 'post',
        })
    
    company.form = companyForm
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
const register = {
    store: Object.assign(store, store),
}

export default register