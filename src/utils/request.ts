import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Session } from '/@/utils/storage';
import qs from 'qs';

// 配置新建一个 axios 实例
const service: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_BASE_API,
	timeout: 50000,
	headers: { 'Content-Type': 'application/json' },
	paramsSerializer: {
		serialize(params) {
			return qs.stringify(params, { allowDots: true });
		},
	},
});

// 添加请求拦截器
service.interceptors.request.use(
	(config: AxiosRequestConfig) => {
		// 在发送请求之前做些什么 token
		if (Session.get('token')) {
			config.headers!['Authorization'] = `Bearer ${Session.get('token')}`;
		}
		return config;
	},
	(error) => {
		// 对请求错误做些什么
		return Promise.reject(error);
	}
);

// 添加响应拦截器
service.interceptors.response.use(
	(response) => {
		// 对响应数据做点什么
		const res = response.data;
		if (res.code && res.code !== 0) {
			// `token` 过期或者账号已在别处登录
			if (res.code === 401 || res.code === 4001) {
				setTimeout(() => {
					ElMessageBox.alert('登录已过期，请重新登录', '提示', {})
						.then(() => {
							Session.clear(); // 清除浏览器全部临时缓存
							window.location.href = '/'; // 去登录页
						})
						.catch(() => { });
				}, 3000);
				Session.clear(); // 清除浏览器全部临时缓存
				window.location.href = '/'; // 去登录页
			}
			return Promise.reject(service.interceptors.response);
		} else {
			return response.data;
		}
	},
	(error) => {

		if (error.response) {
			//const error = err.error = {}
			switch (error.response.status) { // 判断后台返回的token值是否失效
				case 401:
					Session.clear(); // 清除浏览器全部临时缓存
					window.location.href = '/'; // 去登录页
					ElMessageBox.alert('你已被登出，请重新登录', '提示', {})
						.then(() => { })
						.catch(() => { });
					break
				case 400:
					ElMessage.error(error.response.data.error.message);
					break

				case 403:
					ElMessage.error(error.response.data.error.code);
					break

				case 404:
					ElMessage.error('接口路径找不到');
					break

				case 500:
					ElMessage.error('服务器内部错误');
					break

				case 501:
					ElMessage.error('服务器内部错误');
					break

				case 502:
					error.code = "502 Bad Gateway"
					break

				case 503:
					ElMessage.error(error.response.data.error.code);
					break

				default:
					ElMessage.error('网络连接错误');
					break
			}
			return Promise.reject(error)
		} else if (error.request) {
			return Promise.reject(error.request)
		} else {
			// Something happened in setting up the request that triggered an Error
			return Promise.reject(error);
		}
		// 对响应错误做点什么
		// if (error.message.indexOf('timeout') != -1) {
		// 	ElMessage.error('网络超时');
		// } else if (error.message == 'Network Error') {
		// 	ElMessage.error('网络连接错误');
		// } else {
		// 	if (error.response.data) ElMessage.error(error.response.statusText);
		// 	else ElMessage.error('接口路径找不到');
		// }
		// return Promise.reject(error);
	}
);

// 导出 axios 实例
export default service;
