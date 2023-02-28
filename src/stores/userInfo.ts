import { defineStore } from 'pinia';
import Cookies from 'js-cookie';
import { Session } from '/@/utils/storage';
import request from '/@/utils/request';

/**
 * 用户信息
 * @methods setUserInfos 设置用户信息
 */
export const useUserInfo = defineStore('userInfo', {
	state: (): UserInfosState => ({
		userInfos: {
			tenant:'',
			userName: '',
			name:'',
			photo: '',
			time: 0,
			roles: [],
			authBtnList: [],
		},
	}),
	actions: {
		async setUserInfos() {
			// 存储用户信息到浏览器缓存
			if (Session.get('userInfo')) {
				this.userInfos = Session.get('userInfo');
			} else {
				const userInfos: any = await this.getApiUserInfo();
				this.userInfos = userInfos;
			}
		},
		// 模拟接口数据
		// https://gitee.com/lyt-top/vue-next-admin/issues/I5F1HP
		async getApiUserInfo() {
			return new Promise(async (resolve) => {
				var res = await request.get('/api/base/user-menus/permissions')
				const userInfos = {
					tenant:res.tenantId,
					userName: res.userName,
					name: res.name,
					photo: '/favicon.ico',
					roles: [],
					authBtnList: res.menuPermissions
				};
				resolve(userInfos);
				// setTimeout(() => {
				// 	// 模拟数据，请求接口时，记得删除多余代码及对应依赖的引入
				// 	const userName = Cookies.get('userName');
				// 	// 模拟数据
				// 	let defaultRoles: Array<string> = [];
				// 	let defaultAuthBtnList: Array<string> = [];
				// 	// admin 页面权限标识，对应路由 meta.roles，用于控制路由的显示/隐藏
				// 	let adminRoles: Array<string> = ['admin'];
				// 	// admin 按钮权限标识
				// 	let adminAuthBtnList: Array<string> = ['btn.add', 'btn.del', 'btn.edit', 'btn.link'];
				// 	// test 页面权限标识，对应路由 meta.roles，用于控制路由的显示/隐藏
				// 	let testRoles: Array<string> = ['common'];
				// 	// test 按钮权限标识
				// 	let testAuthBtnList: Array<string> = ['btn.add', 'btn.link'];
				// 	// 不同用户模拟不同的用户权限
				// 	if (userName === 'admin') {
				// 		defaultRoles = adminRoles;
				// 		defaultAuthBtnList = adminAuthBtnList;
				// 	} else {
				// 		defaultRoles = testRoles;
				// 		defaultAuthBtnList = testAuthBtnList;
				// 	}
					// 用户信息模拟数据
				// 	const userInfos = {
				// 		userName: userName,
				// 		photo: '/favicon.ico',
				// 		time: new Date().getTime(),
				// 		roles: defaultRoles,
				// 		authBtnList: defaultAuthBtnList,
				// 	};
				// 	resolve(userInfos);
				// }, 0);
			});
		},
	},
});
