<template>
	<div class="system-menu-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="769px">
			<el-form ref="ruleFormRef" :rules="state.rules" :model="state.ruleForm" size="default" label-width="80px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="上级菜单">
							<el-cascader :options="props.menuData" :disabled="state.isEdit"
								:props="{ checkStrictly: true, emitPath: false, value: 'id', label: 'label' }"
								placeholder="请选择上级菜单" clearable class="w100" v-model="state.ruleForm.pid">
								<template #default="{ node, data }">
									<span>{{ data.label }}</span>
									<span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
								</template>
							</el-cascader>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="菜单类型" prop="categoryId">
							<el-select v-model="state.ruleForm.categoryId" placeholder="请选择" style="width: 100%;"
								:disabled="state.isEdit">
								<el-option label="菜单" :value="1"></el-option>
								<el-option label="按钮" :value="2"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="菜单名" prop="name">
							<el-input v-model="state.ruleForm.name" placeholder="请输入菜单名" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="显示名" prop="label">
							<el-input v-model="state.ruleForm.label" placeholder="请输入显示名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="排序" prop="sort">
							<el-input type="number" v-model="state.ruleForm.sort" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="图标" prop="icon">
							<IconSelector placeholder="请输入菜单图标" v-model="state.ruleForm.icon" />
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-if="state.ruleForm.categoryId == 1">
						<el-form-item label="路由地址" prop="path">
							<el-input v-model="state.ruleForm.path" placeholder="请输入路由地址" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-if="state.ruleForm.categoryId == 1">
						<el-form-item label="组件路径" prop="component">
							<el-input v-model="state.ruleForm.component" placeholder="请输入组件路径" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="权限标识" prop="permission">
							<el-input v-model="state.ruleForm.permission" placeholder="请输入权限标识" clearable></el-input>
						</el-form-item>
					</el-col>
					<!-- <template v-if="state.ruleForm.menuType === 'btn'">
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="权限标识">
								<el-input v-model="state.ruleForm.btnPower" placeholder="请输入权限标识" clearable></el-input>
							</el-form-item>
						</el-col>
					</template>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="菜单排序">
							<el-input-number v-model="state.ruleForm.menuSort" controls-position="right" placeholder="请输入排序"
								class="w100" />
						</el-form-item>
					</el-col>
					<template v-if="state.ruleForm.menuType === 'menu'">
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否隐藏">
								<el-radio-group v-model="state.ruleForm.meta.isHide">
									<el-radio :label="true">隐藏</el-radio>
									<el-radio :label="false">不隐藏</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="页面缓存">
								<el-radio-group v-model="state.ruleForm.meta.isKeepAlive">
									<el-radio :label="true">缓存</el-radio>
									<el-radio :label="false">不缓存</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否固定">
								<el-radio-group v-model="state.ruleForm.meta.isAffix">
									<el-radio :label="true">固定</el-radio>
									<el-radio :label="false">不固定</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否外链">
								<el-radio-group v-model="state.ruleForm.isLink" :disabled="state.ruleForm.meta.isIframe">
									<el-radio :label="true">是</el-radio>
									<el-radio :label="false">否</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
						<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
							<el-form-item label="是否内嵌">
								<el-radio-group v-model="state.ruleForm.meta.isIframe" @change="onSelectIframeChange">
									<el-radio :label="true">是</el-radio>
									<el-radio :label="false">否</el-radio>
								</el-radio-group>
							</el-form-item>
						</el-col>
					</template> -->
				</el-row>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="editMenu">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import request from '/@/utils/request';
// import { setBackEndControlRefreshRoutes } from "/@/router/backEnd";

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 引入组件
const IconSelector = defineAsyncComponent(() => import('/@/components/iconSelector/index.vue'));

const props = defineProps({
	title: String,
	menuData: [],
});

// 定义变量内容
const ruleFormRef = ref();
const stores = useRoutesList();
const { routesList } = storeToRefs(stores);
const state = reactive({
	isEdit: false,
	// 参数请参考 `/src/router/route.ts` 中的 `dynamicRoutes` 路由菜单格式
	// ruleForm: {
	// 	menuSuperior: [], // 上级菜单
	// 	menuType: 'menu', // 菜单类型
	// 	name: '', // 路由名称
	// 	component: '', // 组件路径
	// 	isLink: false, // 是否外链
	// 	menuSort: 0, // 菜单排序
	// 	path: '', // 路由路径
	// 	redirect: '', // 路由重定向，有子集 children 时
	// 	meta: {
	// 		title: '', // 菜单名称
	// 		icon: '', // 菜单图标
	// 		isHide: false, // 是否隐藏
	// 		isKeepAlive: true, // 是否缓存
	// 		isAffix: false, // 是否固定
	// 		isLink: '', // 外链/内嵌时链接地址（http:xxx.com），开启外链条件，`1、isLink: 链接地址不为空`
	// 		isIframe: false, // 是否内嵌，开启条件，`1、isIframe:true 2、isLink：链接地址不为空`
	// 		roles: '', // 权限标识，取角色管理
	// 	},
	// 	btnPower: '', // 菜单类型为按钮时，权限标识
	// },
	ruleForm: {
		id: null,
		pid: null,
		categoryId: 1,
		name: null,
		label: '',
		path: '',
		component: '',
		sort: 999,
		icon: '',
		permission: ''
	},
	rules: {
		name: [{ required: true, message: "请输入菜单名", trigger: "blur" }],
		label: [{ required: true, message: "请输入显示名", trigger: "blur" }],
		sort: [{ required: true, message: "请输入序号", trigger: "blur" }]
	},
	//menuData: [] as any, // 上级菜单数据
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row?: any) => {
	if (type === 'edit') {
		state.isEdit = true
		fetchData(row.id)
		state.dialog.title = '修改菜单';
		state.dialog.submitTxt = '修 改';
	} else {
		state.isEdit = false
		state.dialog.title = '新增菜单';
		state.dialog.submitTxt = '新 增';
	}
	state.dialog.isShowDialog = true;
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
	ruleFormRef.value.resetFields();
};

// 取消
const onCancel = () => {
	closeDialog();
};

// 获取用户
const fetchData = async (id: string) => {
	state.ruleForm = await request.get('/api/base/menu/' + id);
}
// 提交
const onSubmit = () => {
	ruleFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		if (state.isEdit) {
			await request.put('/api/base/menu/' + state.ruleForm.id, state.ruleForm);
		} else {
			await request.post('/api/base/menu', state.ruleForm);
			//await request({url: '/api/base/user', method: 'post', data: state.ruleForm});
		}
		closeDialog(); // 关闭弹窗
		emit('refresh');
	})
};
// 页面加载时
onMounted(() => {

});

// 暴露变量
defineExpose({
	openDialog,
});
</script>
