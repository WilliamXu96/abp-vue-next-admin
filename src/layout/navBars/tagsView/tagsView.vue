<template>
	<div class="layout-navbars-tagsview" :class="{ 'layout-navbars-tagsview-shadow': getThemeConfig.layout === 'classic' }">
		<el-scrollbar ref="scrollbarRef" @wheel.prevent="onHandleScroll">
			<ul class="layout-navbars-tagsview-ul" :class="setTagsStyle" ref="tagsUlRef">
				<li
					v-for="(v, k) in state.tagsViewList"
					:key="k"
					class="layout-navbars-tagsview-ul-li"
					:data-url="v.url"
					:class="{ 'is-active': isActive(v) }"
					@contextmenu.prevent="onContextmenu(v, $event)"
					@mousedown="onMousedownMenu(v, $event)"
					@click="onTagsClick(v, k)"
					:ref="
						(el) => {
							if (el) tagsRefs[k] = el;
						}
					"
				>
					<i class="iconfont icon-webicon318 layout-navbars-tagsview-ul-li-iconfont" v-if="isActive(v)"></i>
					<SvgIcon :name="v.meta.icon" v-if="!isActive(v) && getThemeConfig.isTagsviewIcon" class="pr5" />
					<span>{{ setTagsViewNameI18n(v) }}</span>
					<template v-if="isActive(v)">
						<SvgIcon
							name="ele-RefreshRight"
							class="ml5 layout-navbars-tagsview-ul-li-refresh"
							@click.stop="refreshCurrentTagsView($route.fullPath)"
						/>
						<SvgIcon
							name="ele-Close"
							class="layout-navbars-tagsview-ul-li-icon layout-icon-active"
							v-if="!v.meta.isAffix"
							@click.stop="closeCurrentTagsView(getThemeConfig.isShareTagsView ? v.path : v.url)"
						/>
					</template>
					<SvgIcon
						name="ele-Close"
						class="layout-navbars-tagsview-ul-li-icon layout-icon-three"
						v-if="!v.meta.isAffix"
						@click.stop="closeCurrentTagsView(getThemeConfig.isShareTagsView ? v.path : v.url)"
					/>
				</li>
			</ul>
		</el-scrollbar>
		<Contextmenu :dropdown="state.dropdown" ref="contextmenuRef" @currentContextmenuClick="onCurrentContextmenuClick" />
	</div>
</template>

<script setup lang="ts" name="layoutTagsView">
import { defineAsyncComponent, reactive, onMounted, computed, ref, nextTick, onBeforeUpdate, onBeforeMount, onUnmounted, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import Sortable from 'sortablejs';
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import pinia from '/@/stores/index';
import { useTagsViewRoutes } from '/@/stores/tagsViewRoutes';
import { useThemeConfig } from '/@/stores/themeConfig';
import { useKeepALiveNames } from '/@/stores/keepAliveNames';
import { Session } from '/@/utils/storage';
import { isObjectValueEqual } from '/@/utils/arrayOperation';
import other from '/@/utils/other';
import mittBus from '/@/utils/mitt';

// ????????????
const Contextmenu = defineAsyncComponent(() => import('/@/layout/navBars/tagsView/contextmenu.vue'));

// ??????????????????
const tagsRefs = ref<RefType>([]);
const scrollbarRef = ref();
const contextmenuRef = ref();
const tagsUlRef = ref();
const stores = useTagsViewRoutes();
const storesThemeConfig = useThemeConfig();
const storesTagsViewRoutes = useTagsViewRoutes();
const { themeConfig } = storeToRefs(storesThemeConfig);
const { tagsViewRoutes } = storeToRefs(storesTagsViewRoutes);
const storesKeepALiveNames = useKeepALiveNames();
const route = useRoute();
const router = useRouter();
const state = reactive<TagsViewState>({
	routeActive: '',
	routePath: route.path,
	dropdown: { x: '', y: '' },
	sortable: '',
	tagsRefsIndex: 0,
	tagsViewList: [],
	tagsViewRoutesList: [],
});

// ???????????? tagsView ????????????
const setTagsStyle = computed(() => {
	return themeConfig.value.tagsStyle;
});
// ????????????????????????
const getThemeConfig = computed(() => {
	return themeConfig.value;
});
// ?????? ????????? tagsView ????????? ????????? tagsView ???????????????
const setTagsViewNameI18n = computed(() => {
	return (v: RouteItem) => {
		return other.setTagsViewNameI18n(v);
	};
});
// ?????? tagsView ??????
const isActive = (v: RouteItem) => {
	if (getThemeConfig.value.isShareTagsView) {
		return v.path === state.routePath;
	} else {
		if ((v.query && Object.keys(v.query).length) || (v.params && Object.keys(v.params).length)) {
			// ????????????
			return v.url ? v.url === state.routeActive : v.path === state.routeActive;
		} else {
			// ?????? name ?????????params ?????????????????????????????????
			// https://gitee.com/lyt-top/vue-next-admin/issues/I51RS9
			return v.path === state.routePath;
		}
	}
};
// ?????? tagsViewList ????????????????????????????????????????????????????????????
const addBrowserSetSession = (tagsViewList: Array<object>) => {
	Session.set('tagsViewList', tagsViewList);
};
// ?????? pinia ?????? tagsViewRoutes ??????
const getTagsViewRoutes = async () => {
	state.routeActive = await setTagsViewHighlight(route);
	state.routePath = (await route.meta.isDynamic) ? route.meta.isDynamicPath : route.path;
	state.tagsViewList = [];
	state.tagsViewRoutesList = tagsViewRoutes.value;
	initTagsView();
};
// pinia ??????????????????????????????????????????????????????isAffix???????????????????????????
const initTagsView = async () => {
	if (Session.get('tagsViewList') && getThemeConfig.value.isCacheTagsView) {
		state.tagsViewList = await Session.get('tagsViewList');
	} else {
		await state.tagsViewRoutesList.map((v: RouteItem) => {
			if (v.meta?.isAffix && !v.meta.isHide) {
				v.url = setTagsViewHighlight(v);
				state.tagsViewList.push({ ...v });
				storesKeepALiveNames.addCachedView(v);
			}
		});
		await addTagsView(route.path, <RouteToFrom>route);
	}
	// ?????????????????????(li)?????????
	getTagsRefsIndex(getThemeConfig.value.isShareTagsView ? state.routePath : state.routeActive);
};
// ??????????????????????????????????????????????????????????????????xxx/:id/:name"???????????????????????????
const solveAddTagsView = async (path: string, to?: RouteToFrom) => {
	let isDynamicPath = to?.meta?.isDynamic ? to.meta.isDynamicPath : path;
	let current = state.tagsViewList.filter(
		(v: RouteItem) =>
			v.path === isDynamicPath &&
			isObjectValueEqual(
				to?.meta?.isDynamic ? (v.params ? v.params : null) : v.query ? v.query : null,
				to?.meta?.isDynamic ? (to?.params ? to?.params : null) : to?.query ? to?.query : null
			)
	);
	if (current.length <= 0) {
		// ?????????Avoid app logic that relies on enumerating keys on a component instance. The keys will be empty in production mode to avoid performance overhead.
		let findItem = state.tagsViewRoutesList.find((v: RouteItem) => v.path === isDynamicPath);
		if (!findItem) return false;
		if (findItem.meta.isAffix) return false;
		if (findItem.meta.isLink && !findItem.meta.isIframe) return false;
		to?.meta?.isDynamic ? (findItem.params = to.params) : (findItem.query = to?.query);
		findItem.url = setTagsViewHighlight(findItem);
		state.tagsViewList.push({ ...findItem });
		await storesKeepALiveNames.addCachedView(findItem);
		addBrowserSetSession(state.tagsViewList);
	}
};
// ????????????????????????????????????????????????????????? tagsViewList ??????Session Storage???
const singleAddTagsView = (path: string, to?: RouteToFrom) => {
	let isDynamicPath = to?.meta?.isDynamic ? to.meta.isDynamicPath : path;
	state.tagsViewList.forEach((v) => {
		if (
			v.path === isDynamicPath &&
			!isObjectValueEqual(
				to?.meta?.isDynamic ? (v.params ? v.params : null) : v.query ? v.query : null,
				to?.meta?.isDynamic ? (to?.params ? to?.params : null) : to?.query ? to?.query : null
			)
		) {
			to?.meta?.isDynamic ? (v.params = to.params) : (v.query = to?.query);
			v.url = setTagsViewHighlight(v);
			addBrowserSetSession(state.tagsViewList);
		}
	});
};
// 1????????? tagsView?????????????????????isHide?????????????????? tagsView ???????????????????????????????????????????????????
const addTagsView = (path: string, to?: RouteToFrom) => {
	// ??????????????????????????????
	nextTick(async () => {
		// ?????????https://gitee.com/lyt-top/vue-next-admin/issues/I3YX6G
		let item: RouteItem;
		if (to?.meta?.isDynamic) {
			// ???????????????xxx/:id/:name"????????????????????????????????? tagsview
			if (!getThemeConfig.value.isShareTagsView) await solveAddTagsView(path, to);
			else await singleAddTagsView(path, to);
			if (state.tagsViewList.some((v: RouteItem) => v.path === to?.meta?.isDynamicPath)) {
				// ???????????????????????????(????????????) tagsViewList ??????????????????
				addBrowserSetSession(state.tagsViewList);
				return false;
			}
			item = state.tagsViewRoutesList.find((v: RouteItem) => v.path === to?.meta?.isDynamicPath);
		} else {
			// ?????????????????????????????????????????? tagsview
			if (!getThemeConfig.value.isShareTagsView) await solveAddTagsView(path, to);
			else await singleAddTagsView(path, to);
			if (state.tagsViewList.some((v: RouteItem) => v.path === path)) {
				// ???????????????????????????(????????????) tagsViewList ??????????????????
				addBrowserSetSession(state.tagsViewList);
				return false;
			}
			item = state.tagsViewRoutesList.find((v: RouteItem) => v.path === path);
		}
		if (!item) return false;
		if (item?.meta?.isLink && !item.meta.isIframe) return false;
		if (to?.meta?.isDynamic) item.params = to?.params ? to?.params : route.params;
		else item.query = to?.query ? to?.query : route.query;
		item.url = setTagsViewHighlight(item);
		await storesKeepALiveNames.addCachedView(item);
		await state.tagsViewList.push({ ...item });
		await addBrowserSetSession(state.tagsViewList);
	});
};
// 2??????????????? tagsView???
const refreshCurrentTagsView = async (fullPath: string) => {
	const decodeURIPath = decodeURI(fullPath);
	let item: RouteToFrom = {};
	state.tagsViewList.forEach((v: RouteItem) => {
		v.transUrl = transUrlParams(v);
		if (v.transUrl) {
			if (v.transUrl === transUrlParams(v)) item = v;
		} else {
			if (v.path === decodeURIPath) item = v;
		}
	});
	if (!item) return false;
	await storesKeepALiveNames.delCachedView(item);
	mittBus.emit('onTagsViewRefreshRouterView', fullPath);
	if (item.meta?.isKeepAlive) storesKeepALiveNames.addCachedView(item);
};
// 3??????????????? tagsView?????????????????????????????????isAffix?????????????????????
const closeCurrentTagsView = (path: string) => {
	state.tagsViewList.map((v: RouteItem, k: number, arr: RouteItems) => {
		if (!v.meta?.isAffix) {
			if (getThemeConfig.value.isShareTagsView ? v.path === path : v.url === path) {
				storesKeepALiveNames.delCachedView(v);
				state.tagsViewList.splice(k, 1);
				setTimeout(() => {
					if (state.tagsViewList.length === k && getThemeConfig.value.isShareTagsView ? state.routePath === path : state.routeActive === path) {
						// ????????????????????????
						if (arr[arr.length - 1].meta.isDynamic) {
							// ???????????????xxx/:id/:name"???
							if (k !== arr.length) router.push({ name: arr[k].name, params: arr[k].params });
							else router.push({ name: arr[arr.length - 1].name, params: arr[arr.length - 1].params });
						} else {
							// ????????????
							if (k !== arr.length) router.push({ path: arr[k].path, query: arr[k].query });
							else router.push({ path: arr[arr.length - 1].path, query: arr[arr.length - 1].query });
						}
					} else {
						// ????????????????????????????????????????????????
						if (state.tagsViewList.length !== k && getThemeConfig.value.isShareTagsView ? state.routePath === path : state.routeActive === path) {
							if (arr[k].meta.isDynamic) {
								// ???????????????xxx/:id/:name"???
								router.push({ name: arr[k].name, params: arr[k].params });
							} else {
								// ????????????
								router.push({ path: arr[k].path, query: arr[k].query });
							}
						}
					}
				}, 0);
			}
		}
	});
	addBrowserSetSession(state.tagsViewList);
};
// 4??????????????? tagsView?????????????????????????????????isAffix?????????????????????
const closeOtherTagsView = (path: string) => {
	if (Session.get('tagsViewList')) {
		state.tagsViewList = [];
		Session.get('tagsViewList').map((v: RouteItem) => {
			if (v.meta?.isAffix && !v.meta.isHide) {
				v.url = setTagsViewHighlight(v);
				storesKeepALiveNames.delOthersCachedViews(v);
				state.tagsViewList.push({ ...v });
			}
		});
		addTagsView(path, <RouteToFrom>route);
		addBrowserSetSession(state.tagsViewList);
	}
};
// 5??????????????? tagsView?????????????????????????????????isAffix?????????????????????
const closeAllTagsView = () => {
	if (Session.get('tagsViewList')) {
		storesKeepALiveNames.delAllCachedViews();
		state.tagsViewList = [];
		Session.get('tagsViewList').map((v: RouteItem) => {
			if (v.meta?.isAffix && !v.meta.isHide) {
				v.url = setTagsViewHighlight(v);
				state.tagsViewList.push({ ...v });
				router.push({ path: state.tagsViewList[state.tagsViewList.length - 1].path });
			}
		});
		addBrowserSetSession(state.tagsViewList);
	}
};
// 6???????????????????????????
const openCurrenFullscreen = async (path: string) => {
	const item = state.tagsViewList.find((v: RouteItem) => (getThemeConfig.value.isShareTagsView ? v.path === path : v.url === path));
	if (item.meta.isDynamic) await router.push({ name: item.name, params: item.params });
	else await router.push({ name: item.name, query: item.query });
	stores.setCurrenFullscreen(true);
};
// ????????????????????????????????? `???????????????????????????` ?????? `tagsView ????????????`??????????????????????????????????????????
// ?????? tagsView ????????????????????????????????????
// https://gitee.com/lyt-top/vue-next-admin/issues/I61VS9
const getCurrentRouteItem = (item: RouteItem): any => {
	let resItem: RouteToFrom = {};
	state.tagsViewList.forEach((v: RouteItem) => {
		v.transUrl = transUrlParams(v);
		if (v.transUrl) {
			// ????????????????????????????????????
			if (v.transUrl === transUrlParams(v) && v.transUrl === item.commonUrl) resItem = v;
		} else {
			// ??????????????????
			if (v.path === decodeURI(item.path)) resItem = v;
		}
	});
	if (!resItem) return null;
	else return resItem;
};
// ???????????????????????????
const onCurrentContextmenuClick = async (item: RouteItem) => {
	item.commonUrl = transUrlParams(item);
	if (!getCurrentRouteItem(item)) return ElMessage({ type: 'warning', message: '???????????????????????????????????????query???params???' });
	const { path, name, params, query, meta, url } = getCurrentRouteItem(item);
	switch (item.contextMenuClickId) {
		case 0:
			// ????????????
			if (meta.isDynamic) await router.push({ name, params });
			else await router.push({ path, query });
			refreshCurrentTagsView(route.fullPath);
			break;
		case 1:
			// ????????????
			closeCurrentTagsView(getThemeConfig.value.isShareTagsView ? path : url);
			break;
		case 2:
			// ????????????
			if (meta.isDynamic) await router.push({ name, params });
			else await router.push({ path, query });
			closeOtherTagsView(path);
			break;
		case 3:
			// ????????????
			closeAllTagsView();
			break;
		case 4:
			// ????????????????????????
			openCurrenFullscreen(getThemeConfig.value.isShareTagsView ? path : url);
			break;
	}
};
// ????????????????????? x,y ???????????????????????????props???
const onContextmenu = (v: RouteItem, e: MouseEvent) => {
	const { clientX, clientY } = e;
	state.dropdown.x = clientX;
	state.dropdown.y = clientY;
	contextmenuRef.value.openContextmenu(v);
};
// ?????????????????????????????????????????????????????? tasgview
const onMousedownMenu = (v: RouteItem, e: MouseEvent) => {
	if (!v.meta?.isAffix && e.button === 1) {
		const item = Object.assign({}, { contextMenuClickId: 1, ...v });
		onCurrentContextmenuClick(item);
	}
};
// ????????? tagsView ????????????
const onTagsClick = (v: RouteItem, k: number) => {
	state.tagsRefsIndex = k;
	router.push(v);
};
// ?????? url?????????????????????????????????tagsview ????????????????????????????????????????????? @ZzZz-RIPPER???@dejavuuuuu
// https://gitee.com/lyt-top/vue-next-admin/issues/I5K3YO
// https://gitee.com/lyt-top/vue-next-admin/issues/I61VS9
const transUrlParams = (v: RouteItem) => {
	let params = v.query && Object.keys(v.query).length > 0 ? v.query : v.params;
	if (!params) return '';
	let path = '';
	for (let [key, value] of Object.entries(params)) {
		if (v.meta?.isDynamic) path += `/${value}`;
		else path += `&${key}=${value}`;
	}
	// ??????????????????????????????xxx/:id/:name"???isDynamic
	if (v.meta?.isDynamic) {
		/**
		 *
		 * isFnClick ???????????????????????????????????????????????????????????????????????????????????????????????????
		 * ?????????
		 * 1???????????????????????????????????? path ??????????????????????????????????????????/params/dynamic/details/:t/:id/:tagsViewName
		 * 2???????????????????????????????????? path ??????????????????????????????????????????/params/dynamic/details/vue-next-admin/111/????????????????????????tagsViewName(????????????)
		 *
		 * ?????????????????????????????????????????????????????? v.path.split(':')[0]??????????????? + ?????????????????????
		 */
		return v.isFnClick ? decodeURI(v.path) : `${v.path.split(':')[0]}${path.replace(/^\//, '')}`;
	} else {
		return `${v.path}${path.replace(/^&/, '?')}`;
	}
};
// ?????? tagsView ???????????????????????????????????????????????????????????????
const setTagsViewHighlight = (v: RouteToFrom) => {
	let params = v.query && Object.keys(v.query).length > 0 ? v.query : v.params;
	if (!params || Object.keys(params).length <= 0) return v.path;
	let path = '';
	for (let i in params) {
		path += params[i];
	}
	// ??????????????????????????????xxx/:id/:name"???
	return `${v.meta?.isDynamic ? v.meta.isDynamicPath : v.path}-${path}`;
};
// ??????????????????
const onHandleScroll = (e: WheelEventType) => {
	scrollbarRef.value.$refs.wrapRef.scrollLeft += e.wheelDelta / 4;
};
// tagsView ????????????
const tagsViewmoveToCurrentTag = () => {
	nextTick(() => {
		if (tagsRefs.value.length <= 0) return false;
		// ?????? li ??????
		let liDom = tagsRefs.value[state.tagsRefsIndex];
		// ?????? li ????????????
		let liIndex = state.tagsRefsIndex;
		// ?????? ul ??? li ???????????????
		let liLength = tagsRefs.value.length;
		// ?????? li
		let liFirst = tagsRefs.value[0];
		// ?????? li
		let liLast = tagsRefs.value[tagsRefs.value.length - 1];
		// ?????????????????????
		let scrollRefs = scrollbarRef.value.$refs.wrapRef;
		// ???????????????????????????
		let scrollS = scrollRefs.scrollWidth;
		// ???????????????????????????
		let offsetW = scrollRefs.offsetWidth;
		// ???????????????????????????
		let scrollL = scrollRefs.scrollLeft;
		// ????????? tags li dom
		let liPrevTag = tagsRefs.value[state.tagsRefsIndex - 1];
		// ????????? tags li dom
		let liNextTag = tagsRefs.value[state.tagsRefsIndex + 1];
		// ????????? tags li dom ???????????????
		let beforePrevL = 0;
		// ????????? tags li dom ???????????????
		let afterNextL = 0;
		if (liDom === liFirst) {
			// ??????
			scrollRefs.scrollLeft = 0;
		} else if (liDom === liLast) {
			// ??????
			scrollRefs.scrollLeft = scrollS - offsetW;
		} else {
			// ??????/??????
			if (liIndex === 0) beforePrevL = liFirst.offsetLeft - 5;
			else beforePrevL = liPrevTag?.offsetLeft - 5;
			if (liIndex === liLength) afterNextL = liLast.offsetLeft + liLast.offsetWidth + 5;
			else afterNextL = liNextTag.offsetLeft + liNextTag.offsetWidth + 5;
			if (afterNextL > scrollL + offsetW) {
				scrollRefs.scrollLeft = afterNextL - offsetW;
			} else if (beforePrevL < scrollL) {
				scrollRefs.scrollLeft = beforePrevL;
			}
		}
		// ?????????????????????????????????
		scrollbarRef.value.update();
	});
};
// ?????? tagsView ???????????????????????? tagsView ????????????????????????
const getTagsRefsIndex = (path: string | unknown) => {
	nextTick(async () => {
		// await ???????????????????????????????????? tagsViewList ?????????????????????
		let tagsViewList = await state.tagsViewList;
		state.tagsRefsIndex = tagsViewList.findIndex((v: RouteItem) => {
			if (getThemeConfig.value.isShareTagsView) {
				return v.path === path;
			} else {
				return v.url === path;
			}
		});
		// ???????????????????????????????????????????????????
		tagsViewmoveToCurrentTag();
	});
};
// ?????? tagsView ??????????????????
const initSortable = async () => {
	const el = <HTMLElement>document.querySelector('.layout-navbars-tagsview-ul');
	if (!el) return false;
	state.sortable.el && state.sortable.destroy();
	state.sortable = Sortable.create(el, {
		animation: 300,
		dataIdAttr: 'data-url',
		disabled: getThemeConfig.value.isSortableTagsView ? false : true,
		onEnd: () => {
			const sortEndList: RouteItem[] = [];
			state.sortable.toArray().map((val: string) => {
				state.tagsViewList.map((v: RouteItem) => {
					if (v.url === val) sortEndList.push({ ...v });
				});
			});
			addBrowserSetSession(sortEndList);
		},
	});
};
// ???????????????https://gitee.com/lyt-top/vue-next-admin/issues/I3ZRRI
const onSortableResize = async () => {
	await initSortable();
	if (other.isMobile()) state.sortable.el && state.sortable.destroy();
};
// ???????????????
onBeforeMount(() => {
	// ?????????????????????????????????????????????????????????
	onSortableResize();
	// ???????????????https://gitee.com/lyt-top/vue-next-admin/issues/I3ZRRI
	window.addEventListener('resize', onSortableResize);
	// ???????????????????????? 0 ???????????????1 ???????????????2 ???????????????3 ???????????? 4 ???????????????
	mittBus.on('onCurrentContextmenuClick', (data: RouteItem) => {
		// ???????????????????????? tagsView
		data.isFnClick = true;
		onCurrentContextmenuClick(data);
	});
	// ??????????????????????????????/????????????
	mittBus.on('openOrCloseSortable', () => {
		initSortable();
	});
	// ???????????????????????? TagsView ????????????????????????????????????
	mittBus.on('openShareTagsView', () => {
		if (getThemeConfig.value.isShareTagsView) {
			router.push('/home/dashboard');
			state.tagsViewList = [];
			state.tagsViewRoutesList.map((v: RouteItem) => {
				if (v.meta?.isAffix && !v.meta.isHide) {
					v.url = setTagsViewHighlight(v);
					state.tagsViewList.push({ ...v });
				}
			});
		}
	});
});
// ???????????????
onUnmounted(() => {
	// ??????????????????????????????
	mittBus.off('onCurrentContextmenuClick', () => {});
	// ????????????????????????????????????/????????????
	mittBus.off('openOrCloseSortable', () => {});
	// ?????????????????????????????? TagsView ??????
	mittBus.off('openShareTagsView', () => {});
	// ???????????? resize ??????
	window.removeEventListener('resize', onSortableResize);
});
// ???????????????
onBeforeUpdate(() => {
	tagsRefs.value = [];
});
// ???????????????
onMounted(() => {
	// ????????? pinia ?????? tagsViewRoutes ??????
	getTagsViewRoutes();
	initSortable();
});
// ??????????????????????????????????????????
onBeforeRouteUpdate(async (to) => {
	state.routeActive = setTagsViewHighlight(to);
	state.routePath = to.meta.isDynamic ? to.meta.isDynamicPath : to.path;
	await addTagsView(to.path, <RouteToFrom>to);
	getTagsRefsIndex(getThemeConfig.value.isShareTagsView ? state.routePath : state.routeActive);
});
// ??????????????????????????????????????? tagsView
watch(
	pinia.state,
	(val) => {
		if (val.tagsViewRoutes.tagsViewRoutes.length === state.tagsViewRoutesList.length) return false;
		getTagsViewRoutes();
	},
	{
		deep: true,
	}
);
</script>

<style scoped lang="scss">
.layout-navbars-tagsview {
	background-color: var(--el-color-white);
	border-bottom: 1px solid var(--next-border-color-light);
	position: relative;
	z-index: 4;
	:deep(.el-scrollbar__wrap) {
		overflow-x: auto !important;
	}
	&-ul {
		list-style: none;
		margin: 0;
		padding: 0;
		height: 34px;
		display: flex;
		align-items: center;
		color: var(--el-text-color-regular);
		font-size: 12px;
		white-space: nowrap;
		padding: 0 15px;
		&-li {
			height: 26px;
			line-height: 26px;
			display: flex;
			align-items: center;
			border: 1px solid var(--el-border-color-lighter);
			padding: 0 15px;
			margin-right: 5px;
			border-radius: 2px;
			position: relative;
			z-index: 0;
			cursor: pointer;
			justify-content: space-between;
			&:hover {
				background-color: var(--el-color-primary-light-9);
				color: var(--el-color-primary);
				border-color: var(--el-color-primary-light-5);
			}
			&-iconfont {
				position: relative;
				left: -5px;
				font-size: 12px;
			}
			&-icon {
				border-radius: 100%;
				position: relative;
				height: 14px;
				width: 14px;
				text-align: center;
				line-height: 14px;
				right: -5px;
				&:hover {
					color: var(--el-color-white);
					background-color: var(--el-color-primary-light-3);
				}
			}
			.layout-icon-active {
				display: block;
			}
			.layout-icon-three {
				display: none;
			}
		}
		.is-active {
			color: var(--el-color-white);
			background: var(--el-color-primary);
			border-color: var(--el-color-primary);
			transition: border-color 3s ease;
		}
	}
	// ??????4
	.tags-style-four {
		.layout-navbars-tagsview-ul-li {
			margin-right: 0 !important;
			border: none !important;
			position: relative;
			border-radius: 3px !important;
			.layout-icon-active {
				display: none;
			}
			.layout-icon-three {
				display: block;
			}
			&:hover {
				background: none !important;
			}
		}
		.is-active {
			background: none !important;
			color: var(--el-color-primary) !important;
		}
	}
	// ??????5
	.tags-style-five {
		align-items: flex-end;
		.tags-style-five-svg {
			-webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSI+CgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxwYXRoIHRyYW5zZm9ybT0icm90YXRlKC0wLjEzMzUwNiA1MC4xMTkyIDUwKSIgaWQ9InN2Z18xIiBkPSJtMTAwLjExOTE5LDEwMGMtNTUuMjI4LDAgLTEwMCwtNDQuNzcyIC0xMDAsLTEwMGwwLDEwMGwxMDAsMHoiIG9wYWNpdHk9InVuZGVmaW5lZCIgc3Ryb2tlPSJudWxsIiBmaWxsPSIjRjhFQUU3Ii8+CiAgPHBhdGggZD0ibS0wLjYzNzY2LDcuMzEyMjhjMC4xMTkxOSwwIDAuMjE3MzcsMC4wNTc5NiAwLjQ3Njc2LDAuMTE5MTljMC4yMzIsMC4wNTQ3NyAwLjI3MzI5LDAuMDM0OTEgMC4zNTc1NywwLjExOTE5YzAuMDg0MjgsMC4wODQyOCAwLjM1NzU3LDAgMC40NzY3NiwwbDAuMTE5MTksMGwwLjIzODM4LDAiIGlkPSJzdmdfMiIgc3Ryb2tlPSJudWxsIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0ibTI4LjkyMTM0LDY5LjA1MjQ0YzAsMC4xMTkxOSAwLDAuMjM4MzggMCwwLjM1NzU3bDAsMC4xMTkxOWwwLDAuMTE5MTkiIGlkPSJzdmdfMyIgc3Ryb2tlPSJudWxsIiBmaWxsPSJub25lIi8+CiAgPHJlY3QgaWQ9InN2Z180IiBoZWlnaHQ9IjAiIHdpZHRoPSIxLjMxMTA4IiB5PSI2LjgzNTUyIiB4PSItMC4wNDE3MSIgc3Ryb2tlPSJudWxsIiBmaWxsPSJub25lIi8+CiAgPHJlY3QgaWQ9InN2Z181IiBoZWlnaHQ9IjEuNzg3ODQiIHdpZHRoPSIwLjExOTE5IiB5PSI2OC40NTY1IiB4PSIyOC45MjEzNCIgc3Ryb2tlPSJudWxsIiBmaWxsPSJub25lIi8+CiAgPHJlY3QgaWQ9InN2Z182IiBoZWlnaHQ9IjQuODg2NzciIHdpZHRoPSIxOS4wNzAzMiIgeT0iNTEuMjkzMjEiIHg9IjM2LjY2ODY2IiBzdHJva2U9Im51bGwiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+'),
				url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSI+CiA8Zz4KICA8dGl0bGU+TGF5ZXIgMTwvdGl0bGU+CiAgPHBhdGggdHJhbnNmb3JtPSJyb3RhdGUoLTg5Ljc2MjQgNy4zMzAxNCA1NS4xMjUyKSIgc3Ryb2tlPSJudWxsIiBpZD0ic3ZnXzEiIGZpbGw9IiNGOEVBRTciIGQ9Im02Mi41NzQ0OSwxMTcuNTIwODZjLTU1LjIyOCwwIC0xMDAsLTQ0Ljc3MiAtMTAwLC0xMDBsMCwxMDBsMTAwLDB6IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPgogIDxwYXRoIGQ9Im0tMC42Mzc2Niw3LjMxMjI4YzAuMTE5MTksMCAwLjIxNzM3LDAuMDU3OTYgMC40NzY3NiwwLjExOTE5YzAuMjMyLDAuMDU0NzcgMC4yNzMyOSwwLjAzNDkxIDAuMzU3NTcsMC4xMTkxOWMwLjA4NDI4LDAuMDg0MjggMC4zNTc1NywwIDAuNDc2NzYsMGwwLjExOTE5LDBsMC4yMzgzOCwwIiBpZD0ic3ZnXzIiIHN0cm9rZT0ibnVsbCIgZmlsbD0ibm9uZSIvPgogIDxwYXRoIGQ9Im0yOC45MjEzNCw2OS4wNTI0NGMwLDAuMTE5MTkgMCwwLjIzODM4IDAsMC4zNTc1N2wwLDAuMTE5MTlsMCwwLjExOTE5IiBpZD0ic3ZnXzMiIHN0cm9rZT0ibnVsbCIgZmlsbD0ibm9uZSIvPgogIDxyZWN0IGlkPSJzdmdfNCIgaGVpZ2h0PSIwIiB3aWR0aD0iMS4zMTEwOCIgeT0iNi44MzU1MiIgeD0iLTAuMDQxNzEiIHN0cm9rZT0ibnVsbCIgZmlsbD0ibm9uZSIvPgogIDxyZWN0IGlkPSJzdmdfNSIgaGVpZ2h0PSIxLjc4Nzg0IiB3aWR0aD0iMC4xMTkxOSIgeT0iNjguNDU2NSIgeD0iMjguOTIxMzQiIHN0cm9rZT0ibnVsbCIgZmlsbD0ibm9uZSIvPgogIDxyZWN0IGlkPSJzdmdfNiIgaGVpZ2h0PSI0Ljg4Njc3IiB3aWR0aD0iMTkuMDcwMzIiIHk9IjUxLjI5MzIxIiB4PSIzNi42Njg2NiIgc3Ryb2tlPSJudWxsIiBmaWxsPSJub25lIi8+CiA8L2c+Cjwvc3ZnPg=='),
				url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><rect rx='8' width='100%' height='100%' fill='%23F8EAE7'/></svg>");
			-webkit-mask-size: 18px 30px, 20px 30px, calc(100% - 30px) calc(100% + 17px);
			-webkit-mask-position: right bottom, left bottom, center top;
			-webkit-mask-repeat: no-repeat;
		}
		.layout-navbars-tagsview-ul-li {
			padding: 0 5px;
			border-width: 15px 27px 15px;
			border-style: solid;
			border-color: transparent;
			margin: 0 -15px;
			.layout-icon-active,
			.layout-navbars-tagsview-ul-li-iconfont,
			.layout-navbars-tagsview-ul-li-refresh {
				display: none;
			}
			.layout-icon-three {
				display: block;
			}
			&:hover {
				@extend .tags-style-five-svg;
				background: var(--el-color-primary-light-9);
				color: unset;
			}
		}
		.is-active {
			@extend .tags-style-five-svg;
			background: var(--el-color-primary-light-9) !important;
			color: var(--el-color-primary) !important;
			z-index: 1;
		}
	}
}
.layout-navbars-tagsview-shadow {
	box-shadow: rgb(0 21 41 / 4%) 0px 1px 4px;
}
</style>
