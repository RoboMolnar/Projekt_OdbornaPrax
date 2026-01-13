import RegisterStudentController from './RegisterStudentController'
import RegisterCompanyController from './RegisterCompanyController'
import ForcedPasswordController from './ForcedPasswordController'
import RegisteredUserController from './RegisteredUserController'
import AuthenticatedSessionController from './AuthenticatedSessionController'
import PasswordResetLinkController from './PasswordResetLinkController'
import NewPasswordController from './NewPasswordController'
const Auth = {
    RegisterStudentController: Object.assign(RegisterStudentController, RegisterStudentController),
RegisterCompanyController: Object.assign(RegisterCompanyController, RegisterCompanyController),
ForcedPasswordController: Object.assign(ForcedPasswordController, ForcedPasswordController),
RegisteredUserController: Object.assign(RegisteredUserController, RegisteredUserController),
AuthenticatedSessionController: Object.assign(AuthenticatedSessionController, AuthenticatedSessionController),
PasswordResetLinkController: Object.assign(PasswordResetLinkController, PasswordResetLinkController),
NewPasswordController: Object.assign(NewPasswordController, NewPasswordController),
}

export default Auth