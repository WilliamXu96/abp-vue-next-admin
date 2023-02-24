<template>
	<div class="system-dic-dialog-container">
		<el-dialog :title="props.title" v-model="state.dialog.isShowDialog" width="700px">
			<el-form ref="ruleFormRef" :rules="state.rules" :model="state.ruleForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="分类名称" prop="name">
							<el-input v-model="state.ruleForm.name" placeholder="请输入字典名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="描述" prop="description">
							<el-input v-model="state.ruleForm.description" clearable></el-input>
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

		<el-dialog :title="props.title" v-model="state.dialog.isShowDetailDialog" width="700px">
			<el-form ref="ruleDetailFormRef" :rules="state.rules" :model="state.ruleDetailForm" size="default" label-width="90px">
				<el-row :gutter="35">
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="字典名称" prop="label">
							<el-input v-model="state.ruleDetailForm.label" placeholder="请输入字典名称" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="字典值" prop="value">
							<el-input v-model="state.ruleDetailForm.value" clearable></el-input>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" class="mb20">
						<el-form-item label="排序" prop="sort">
							<el-input v-model="state.ruleDetailForm.sort" type="number" clearable></el-input>
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<span class="dialog-footer">
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onDetailSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="dicDialog">
import { reactive, ref } from 'vue';
import request from '/@/utils/request';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh', 'refreshDetail']);

const props = defineProps({
	title: String
});

// 定义变量内容
const ruleFormRef = ref();
const ruleDetailFormRef =ref();
const state = reactive({
	isEdit: false,
	ruleForm: {
		id: undefined,
		name: '',
		description: '',
	},
	ruleDetailForm:{
		id: undefined,
		pid:'',
		label: '',
		value: '',
		sort:999
	},
	rules: {
		name: [{ required: true, message: "请输入名称", trigger: "blur" }],
		label: [{ required: true, message: "请输入字典名", trigger: "blur" }],
		value: [{ required: true, message: "请输入字典值", trigger: "blur" }],
	},
	dialog: {
		isShowDialog: false,
		isShowDetailDialog:false,
		type: '',
		title: '',
		submitTxt: '',
	},
});

// 打开弹窗
const openDialog = async (type: string, row: any) => {
	if(type === 'detailEdit'){
		fetchDetailData(row.id)
		state.isEdit = true
		state.dialog.submitTxt = '修 改';
		state.dialog.isShowDetailDialog = true;
	}
	if (type === 'edit') {
		fetchData(row.id)
		state.isEdit = true
		state.dialog.submitTxt = '修 改';
		state.dialog.isShowDialog = true;
	}
	if (type === 'add') {
		state.isEdit = false
		state.dialog.submitTxt = '新 增';
		state.dialog.isShowDialog = true;
	}
	if (type === 'addDetail') {
		state.isEdit = false
		state.dialog.submitTxt = '新 增';
		state.dialog.isShowDetailDialog = true;
		state.ruleDetailForm.pid = row
	}
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
	state.dialog.isShowDetailDialog = false;
	ruleFormRef.value.resetFields();
	ruleDetailFormRef.value.resetFields();
};
// 取消
const onCancel = () => {
	closeDialog();
};
// 获取字典
const fetchData = async (id: string) => {
	state.ruleForm = await request.get('/api/base/dict/' + id);
}
// 获取字典
const fetchDetailData = async (id: string) => {
	state.ruleDetailForm = await request.get('/api/base/dictDetails/' + id);
	state.ruleDetailForm.pid = id
}
// 提交
const onSubmit = () => {
	ruleFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		if (state.isEdit) {
			await request.put('/api/base/dict/' + state.ruleForm.id, state.ruleForm);
		} else {
			await request.post('/api/base/dict', state.ruleForm);
		}
		closeDialog();
		emit('refresh');

	})
};
// 提交
const onDetailSubmit = () => {
	ruleDetailFormRef.value.validate(async (valid: boolean) => {
		if (!valid) return;
		if (state.isEdit) {
			await request.put('/api/base/dictDetails/' + state.ruleDetailForm.id, state.ruleDetailForm);
		} else {
			await request.post('/api/base/dictDetails', state.ruleDetailForm);
		}
		closeDialog();
		emit('refreshDetail');

	})
};

// 暴露变量
defineExpose({
	openDialog,
});
</script>
