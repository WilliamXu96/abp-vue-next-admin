import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import qs from 'qs';


export const userLogin = (url, params) => {
	const instance = axios.create({
		baseURL: import.meta.env.VITE_AUTH_API,

	})
	if (params.tenant && params.tenant.trim() != '') {
		url = url + "?__tenant=" + params.tenant
	}
	return new Promise((resolve, reject) => {
		instance.post(url, qs.stringify(params))
			.then(response => {
				resolve(response.data)
			}, err => {
				if (err.response.status === 400) {
					ElMessage.error('用户名或密码错误');
				} else {
					ElMessage.error(err.message);
				}
				reject(err)
			})
			.catch((error) => {
				ElMessage.error('登录异常');
				reject(error)
			})
	})
};

export const signOut = () => {

};
