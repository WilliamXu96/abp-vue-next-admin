<template>
	<div class="system-user-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="700px">
			<el-form ref="ruleFormRef" :rules="state.rules" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="用户名" prop="userName">
							<el-input v-model="state.ruleForm.userName" placeholder="请输入用户名" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="电话" prop="phoneNumber">
							<el-input v-model="state.ruleForm.phoneNumber" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="姓名" prop="name">
							<el-input v-model="state.ruleForm.name" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="邮箱" prop="email">
							<el-input v-model="state.ruleForm.email" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-if="!state.isEdit">
						<el-form-item label="密码" prop="password">
							<el-input v-model="state.ruleForm.password" type="password" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20" v-if="state.isEdit">
						<el-form-item label="密码" prop="pwd">
							<el-input v-model="state.ruleForm.password" type="password" placeholder="如果为空则不修改密码"
								clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="关联角色" prop="roles">
							<el-select v-model="state.ruleForm.roleNames" multiple placeholder="请选择" clearable class="w100">
								<el-option v-for="item in state.roleList" :key="item.id" :label="item.name"
									:value="item.name"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="岗位" prop="roles">
							<el-select v-model="state.ruleForm.jobIds" multiple placeholder="请选择" clearable class="w100">
								<el-option v-for="item in state.jobData" :key="item.id" :label="item.name"
									:value="item.id"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="允许锁定">
							<el-select v-model="state.ruleForm.lockoutEnabled" placeholder="请选择" clearable class="w100">
								<el-option label="是" :value="true"></el-option>
								<el-option label="否" :value="false"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="所属机构">
							<el-tree ref="treeRef" :data="state.orgData" node-key="id" show-checkbox
								:props="{ children: 'children', label: 'label', class: treeNodeClass }" icon="ele-Menu"
								highlight-current />
						</el-form-item>
					</el-col>

					<!-- <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="性别">
							<el-select v-model="state.ruleForm.sex" placeholder="请选择" clearable class="w100">
								<el-option label="男" value="男"></el-option>
								<el-option label="女" value="女"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="账户密码">
							<el-input v-model="state.ruleForm.password" placeholder="请输入" type="password" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="用户状态">
							<el-switch v-model="state.ruleForm.status" inline-prompt active-text="启" inactive-text="禁"></el-switch>
						</el-form-item>
					</el-col> -->
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

<script setup lang="ts" name="editUser">
import { reactive, ref } from 'vue';
import { verifyPhone } from "/@/utils/toolsValidate";
import type { ElTree } from 'element-plus';
import request from '/@/utils/request';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const ruleFormRef = ref();
const treeRef = ref<InstanceType<typeof ElTree>>();
// 自定义验证
const validPhone = (rule, value, callback) => {
	if (!value) {
		callback(new Error("请输入电话号码"));
	} else if (!verifyPhone(value)) {
		callback(new Error("请输入正确的11位手机号码"));
	} else {
		callback();
	}
};
const state = reactive({
	isEdit: false,
	ruleForm: {
		id: undefined,
		organizationIds: [] as Array<string>,
		userName: '',
		phoneNumber: '',
		name: '',
		email: '',
		password: '',
		lockoutEnabled: false,
		roleNames: [],
		jobIds: [],
		orgIdToName: null,
	},
	rules: {
		userName: [
			{ required: true, message: "请输入用户名", trigger: "blur" },
			{ min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
		],
		name: [
			{ required: true, message: "请输入用户姓名", trigger: "blur" },
			{ min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
		],
		email: [
			{ required: true, message: "请输入邮箱地址", trigger: "blur" },
			{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
		],
		phoneNumber: [
			{ required: true, trigger: "blur", validator: validPhone }
		]
	},
	orgData: [] as any,
	jobData: [] as any,
	roleList: [] as any,
	checkedRole: [],
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = async (type: string, row: any) => {
	await getAllRoles()
	await loadOrgTree()
	await getJobs()
	if (type === 'edit') {
		fetchData(row.id)
		state.isEdit = true
		state.dialog.title = '修改用户';
		state.dialog.submitTxt = '修 改';
	} else {
		state.isEdit = false
		state.dialog.title = '新增用户';
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
	state.ruleForm = await request.get('/api/base/user/' + id);
	treeRef.value?.setCheckedKeys(state.ruleForm.organizationIds);
}

// 获取角色列表
const getAllRoles = async () => {
	const res = await request.get('/api/identity/roles/all')
	state.roleList = res.items
}

// 获取岗位列表
const getJobs = async () => {
	state.jobData = await request.get('/api/base/job/jobs')
}

// 加载组织机构树形
const loadOrgTree = async () => {
	state.orgData = []
	treeRef.value?.setCheckedKeys([]); // 清空选中值
	const res = await request.get('/api/base/orgs/loadNodes');
	res.items.forEach((element) => {
		if (!element.pid) {
			element.hasChildren = element.leaf ? false : true;
			if (!element.leaf) {
				element.children = [];
			}
			state.orgData.push(element);
		}
	});
	setChildren(state.orgData, res.items);
}

const setChildren = (roots, items) => {
	roots.forEach((element) => {
		items.forEach((item) => {
			if (item.pid == element.id) {
				if (!element.children) element.children = [];
				element.children.push(item);
			}
		});
		if (element.children) {
			setChildren(element.children, items);
		}
	});
}

// 叶子节点同行显示样式
const treeNodeClass = (node: any) => {
	let addClass = true; // 添加叶子节点同行显示样式
	for (const key in node.children) {
		// 如果存在子节点非叶子节点，不添加样式
		if (node.children[key].children?.length ?? 0 > 0) {
			addClass = false;
			break;
		}
	}
	return addClass ? 'penultimate-node' : '';
};

// 提交
const onSubmit = () => {
	ruleFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		state.ruleForm.organizationIds = treeRef.value?.getCheckedKeys() as Array<string>;
		if (state.isEdit) {
			await request.put('/api/base/user/' + state.ruleForm.id, state.ruleForm);
		} else {
			await request.post('/api/base/user', state.ruleForm);
			//await request({url: '/api/base/user', method: 'post', data: state.ruleForm});
		}
		closeDialog();
		emit('refresh');

	})
	// if (state.dialog.type === 'add') { }
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
