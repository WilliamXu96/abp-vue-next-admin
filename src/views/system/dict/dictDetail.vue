<template>
    <el-table :data="state.dictData" v-loading="state.loading" style="width: 100%">
        <el-table-column type="index" label="序号" width="50" />
        <el-table-column prop="dicName" label="字典名称" show-overflow-tooltip></el-table-column>
        <el-table-column prop="fieldName" label="字段名" show-overflow-tooltip></el-table-column>
        <el-table-column prop="status" label="字典状态" show-overflow-tooltip>
            <template #default="scope">
                <el-tag type="success" v-if="scope.row.status">启用</el-tag>
                <el-tag type="info" v-else>禁用</el-tag>
            </template>
        </el-table-column>
        <el-table-column prop="describe" label="字典描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="100">
            <template #default="scope">
                <el-button size="small" text type="primary" @click="handleUpdate(scope.row)">修改</el-button>
                <el-button size="small" text type="primary" @click="onRowDel(scope.row)">删除</el-button>
            </template>
        </el-table-column>
    </el-table>
    <el-pagination class="mt15" v-model:currentPage="state.page" v-model:page-size="state.tableParams.MaxResultCount"
        :total="state.totalCount" :page-sizes="[10, 20, 50, 100]" small background @size-change="handleSizeChange"
        @current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper" />
</template>

<script setup lang="ts" name="dictDetail">
import { reactive, ref } from 'vue';

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// 定义变量内容
const dicDialogFormRef = ref();
const state = reactive({
    ruleForm: {
        dicName: '', // 字典名称
        fieldName: '', // 字段名
        status: true, // 字典状态
        list: [] as ListType[], // 子集字段 + 属性值
        describe: '', // 字典描述
    },
    dialog: {
        isShowDialog: false,
        type: '',
        title: '',
        submitTxt: '',
    },
});

// 打开弹窗
const openDialog = (type: string, row: RowDicType) => {
    if (type === 'edit') {
        if (row.fieldName === 'SYS_UERINFO') {
            row.list = [
                { id: Math.random(), label: 'sex', value: '1' },
                { id: Math.random(), label: 'sex', value: '0' },
            ];
        } else {
            row.list = [
                { id: Math.random(), label: 'role', value: 'admin' },
                { id: Math.random(), label: 'role', value: 'common' },
                { id: Math.random(), label: 'roleName', value: '超级管理员' },
                { id: Math.random(), label: 'roleName', value: '普通用户' },
            ];
        }
        state.ruleForm = row;
        state.dialog.title = '修改字典';
        state.dialog.submitTxt = '修 改';
    } else {
        state.dialog.title = '新增字典';
        state.dialog.submitTxt = '新 增';
        // 清空表单，此项需加表单验证才能使用
        // nextTick(() => {
        // 	dicDialogFormRef.value.resetFields();
        // });
    }
    state.dialog.isShowDialog = true;
};
// 关闭弹窗
const closeDialog = () => {
    state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
    closeDialog();
};
// 提交
const onSubmit = () => {
    closeDialog();
    emit('refresh');
    // if (state.dialog.type === 'add') { }
};
// 新增行
const onAddRow = () => {
    state.ruleForm.list.push({
        id: Math.random(),
        label: '',
        value: '',
    });
};
// 删除行
const onDelRow = (k: number) => {
    state.ruleForm.list.splice(k, 1);
};

// 暴露变量
defineExpose({
    openDialog,
});
</script>
