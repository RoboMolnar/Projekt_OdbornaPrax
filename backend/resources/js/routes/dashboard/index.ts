import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
export const student = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: student.url(options),
    method: 'get',
})

student.definition = {
    methods: ["get","head"],
    url: '/dashboard-student',
} satisfies RouteDefinition<["get","head"]>

/**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
student.url = (options?: RouteQueryOptions) => {
    return student.definition.url + queryParams(options)
}

/**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
student.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: student.url(options),
    method: 'get',
})
/**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
student.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: student.url(options),
    method: 'head',
})

    /**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
    const studentForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: student.url(options),
        method: 'get',
    })

            /**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
        studentForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: student.url(options),
            method: 'get',
        })
            /**
 * @see routes/web.php:32
 * @route '/dashboard-student'
 */
        studentForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: student.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    student.form = studentForm
const dashboard = {
    student: Object.assign(student, student),
}

export default dashboard