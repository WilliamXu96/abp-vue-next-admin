<template>
	<div class="system-user-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="700px">
			<el-form ref="ruleFormRef" :rules="state.rules" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="机构类型" prop="categoryId">
							<el-select v-model="state.ruleForm.categoryId" placeholder="请选择" style="width: 380px;"
								:disabled="state.isEdit">
								<el-option label="公司" :value="1"></el-option>
								<el-option label="组织" :value="2"></el-option>
								<el-option label="部门" :value="3"></el-option>
								<el-option label="供应商" :value="4"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="机构名称" prop="name">
							<el-input v-model="state.ruleForm.name" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="机构排序" prop="sort">
							<el-input type="number" v-model="state.ruleForm.sort" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="机构状态">
							<el-select v-model="state.ruleForm.enabled" placeholder="请选择状态" class="w100">
								<el-option label="启用" :value="true"></el-option>
								<el-option label="禁用" :value="false"></el-option>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="mb20">
						<el-form-item label="上级机构">
							<el-cascader :options="state.orgData" :disabled="state.isEdit"
								:props="{ checkStrictly: true, emitPath: false, value: 'id', label: 'label' }"
								placeholder="请选择上级机构，默认顶级机构" clearable class="w100" v-model="state.ruleForm.pid">
								<template #default="{ node, data }">
									<span>{{ data.label }}</span>
									<span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
								</template>
							</el-cascader>
						</el-form-item>
					</el-col>
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

<script setup lang="ts" name="editOrg">
import { reactive, ref } from 'vue';
import request from '/@/utils/request';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const ruleFormRef = ref();
const state = reactive({
	isEdit: false,
	ruleForm: {
		id: undefined,
		pid: undefined,
		categoryId: 3,
		name: '',
		sort: 999,
		enabled: true
	},
	rules: {
		name: [
			{ required: true, message: "请输入机构名称", trigger: "blur" }
		]
	},
	orgData: [] as any,
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
	await loadOrgTree()
	if (type === 'edit') {
		fetchData(row.id)
		state.isEdit = true
		state.dialog.title = '修改组织机构';
		state.dialog.submitTxt = '修 改';
	} else {
		state.isEdit = false
		state.dialog.title = '新增组织机构';
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
	const response = await request.get('/api/base/orgs/' + id);
	state.ruleForm = response
}

// 加载组织机构树形
const loadOrgTree = async () => {
	state.orgData = []
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

// 提交
const onSubmit = () => {
	ruleFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		if (state.isEdit) {
			await request.put('/api/base/orgs/' + state.ruleForm.id, state.ruleForm);
		} else {
			await request.post('/api/base/orgs', state.ruleForm);
		}
		closeDialog();
		emit('refresh');

	})
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
