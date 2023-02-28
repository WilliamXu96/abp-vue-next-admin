<template>
	<div class="system-role-dialog-container">
		<el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog" width="700px">
			<el-form ref="ruleFormRef" :rules="state.rules" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="分类名称" prop="name">
							<el-input v-model="state.ruleForm.name" placeholder="请输入角色名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="属性">
							<el-checkbox v-model="state.ruleForm.isDefault">默认</el-checkbox>
							<el-checkbox v-model="state.ruleForm.isPublic">公共</el-checkbox>
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

<script setup lang="ts" name="editRole">
import { reactive, ref } from 'vue';
import request from '/@/utils/request';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const ruleFormRef = ref();
const state = reactive({
	isEdit:false,
	ruleForm: {
		id: null,
		name: '', // 角色名称
		isDefault: false, // 默认
		isPublic: false, // 公共
	},
	rules: {
		name: [{ required: true, message: "请输入角色名", trigger: "blur" }],
	},
	
	menuProps: {
		children: 'children',
		label: 'label',
	},
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = (type: string, row: any) => {
	if (type === 'edit') {
		fetchData(row.id)
		state.isEdit = true
		state.dialog.title = '修改角色';
		state.dialog.submitTxt = '修 改';
	} else {
		state.isEdit = false
		state.dialog.title = '新增角色';
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

// 获取角色
const fetchData = async (id: string) => {
	state.ruleForm = await request.get('/api/identity/roles/' + id);
}

// 提交
const onSubmit = () => {
	ruleFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		if (state.isEdit) {
			await request.put('/api/identity/roles/' + state.ruleForm.id, state.ruleForm);
		} else {
			await request.post('/api/identity/roles', state.ruleForm);
		}
		closeDialog(); // 关闭弹窗
		emit('refresh');
	})
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>

<style scoped lang="scss">
.system-role-dialog-container {
	.menu-data-tree {
		width: 100%;
		border: 1px solid var(--el-border-color);
		border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
		padding: 5px;
	}
}
</style>
