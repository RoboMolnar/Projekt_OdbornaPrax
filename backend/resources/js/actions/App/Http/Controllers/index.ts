import Auth from './Auth'
import CompanyActivationController from './CompanyActivationController'
import Settings from './Settings'
const Controllers = {
    Auth: Object.assign(Auth, Auth),
CompanyActivationController: Object.assign(CompanyActivationController, CompanyActivationController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers