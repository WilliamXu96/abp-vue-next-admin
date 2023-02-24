<template>
	<div class="system-dic-container layout-padding">
		<el-row :gutter="8" style="width: 100%">
			<el-col :span="12" :xs="24">
				<el-card shadow="hover" class="layout-padding-auto">
					<el-form :model="state.tableParams" ref="queryForm" :inline="true">
						<el-form-item>
							<el-input placeholder="搜索..." @keyup.enter="handleQuery" v-model="state.tableParams.Filter" />
						</el-form-item>
						<el-form-item>
							<el-button type="primary" icon="ele-Search" @click="handleQuery"> 查询
							</el-button>
							<el-button icon="ele-Plus" @click="handleCreate"> 新增分类 </el-button>
						</el-form-item>
					</el-form>
					<el-table :data="state.dictData" v-loading="state.loading" highlight-current-row
						@row-click="handleRowClick" style="width: 100%">
						<el-table-column prop="name" label="字典名称" show-overflow-tooltip></el-table-column>
						<el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
						<!-- <el-table-column prop="status" label="字典状态" show-overflow-tooltip>
							<template #default="scope">
								<el-tag type="success" v-if="scope.row.status">启用</el-tag>
								<el-tag type="info" v-else>禁用</el-tag>
							</template>
						</el-table-column> -->
						<el-table-column label="操作" width="100">
							<template #default="scope">
								<el-button size="small" text type="primary" @click="handleUpdate(scope.row)">修改</el-button>
								<el-button size="small" text type="primary" @click="handleDelete(scope.row)">删除</el-button>
							</template>
						</el-table-column>
					</el-table>
					<el-pagination class="mt15" v-model:currentPage="state.page"
						v-model:page-size="state.tableParams.MaxResultCount" :total="state.totalCount"
						:page-sizes="[10, 20, 50, 100]" small background @size-change="handleSizeChange"
						@current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper" />
				</el-card>
			</el-col>
			<el-col :span="12" :xs="24">
				<el-card shadow="hover" class="layout-padding-auto">
					<el-form :model="state.tableParams" ref="queryForm" :inline="true">
						<el-form-item>
							<el-button icon="ele-Plus" text type="primary" @click="handleDetailCreate"
								:disabled="!state.detailTableParams.Pid"> 新增字典 </el-button>
						</el-form-item>
					</el-form>
					<el-table ref="multipleTableRef" :data="state.dictDetailData" v-loading="state.detailLoading"
						style="width: 100%">
						<el-table-column prop="label" label="显示名" show-overflow-tooltip></el-table-column>
						<el-table-column prop="value" label="字典值" show-overflow-tooltip></el-table-column>
						<el-table-column prop="sort" label="排序" show-overflow-tooltip></el-table-column>
						<!-- <el-table-column prop="status" label="字典状态" show-overflow-tooltip>
							<template #default="scope">
								<el-tag type="success" v-if="scope.row.status">启用</el-tag>
								<el-tag type="info" v-else>禁用</el-tag>
							</template>
						</el-table-column> -->
						<el-table-column label="操作" width="100">
							<template #default="scope">
								<el-button size="small" text type="primary"
									@click="handleDetailUpdate(scope.row)">修改</el-button>
								<el-button size="small" text type="primary"
									@click="handleDetailDelete(scope.row)">删除</el-button>
							</template>
						</el-table-column>
					</el-table>
					<el-pagination class="mt15" v-model:currentPage="state.detailPage"
						v-model:page-size="state.detailTableParams.MaxResultCount" :total="state.detailTotalCount"
						:page-sizes="[10, 20, 50, 100]" small background @size-change="handleSizeChange"
						@current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper" />
				</el-card>
			</el-col>
		</el-row>

		<DicDialog ref="dicDialogRef" @refresh="handleQuery()" @refreshDetail="handleDetailQuery()"
			:title="state.editTitle" />
	</div>
</template>

<script setup lang="ts" name="systemDic">
import { reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage, ElTable } from 'element-plus';
import DicDialog from '/@/views/system/dict/dialog.vue';
import request from '/@/utils/request';

// 定义变量内容

const dicDialogRef = ref();
const state = reactive({
	dictData: [],
	dictDetailData: [],
	totalCount: 0,
	detailTotalCount: 0,
	loading: false,
	detailLoading: false,
	orgFilter: '',
	page: 1,
	detailPage: 1,
	tableParams: {
		Filter: "",
		Sorting: "",
		SkipCount: 0,
		MaxResultCount: 10
	},
	detailTableParams: {
		Pid: "",
		Sorting: "",
		SkipCount: 0,
		MaxResultCount: 10
	},
	editTitle: '',
});

// 初始化表格数据
const handleQuery = async () => {
	state.loading = true;
	state.tableParams.SkipCount = (state.page - 1) * state.tableParams.MaxResultCount;
	var response = await request.get('/api/base/dict/all', { params: state.tableParams })
	state.dictData = response.items;
	state.detailTableParams.Pid=''
	state.dictDetailData = []
	state.totalCount = response.totalCount;
	state.loading = false;
};
const handleDetailQuery = async () => {
	state.detailLoading = true;
	state.detailTableParams.SkipCount = (state.page - 1) * state.detailTableParams.MaxResultCount;
	var response = await request.get('/api/base/dictDetails/all', { params: state.detailTableParams })
	state.dictDetailData = response.items;
	state.detailTotalCount = response.totalCount;
	state.detailLoading = false;
}
// 打开新增字典弹窗
const handleCreate = () => {
	state.editTitle = '新增分类'
	dicDialogRef.value?.openDialog('add');
};
// 打开新增字典弹窗
const handleDetailCreate = () => {
	state.editTitle = '新增字典'
	dicDialogRef.value?.openDialog('addDetail', state.detailTableParams.Pid);
};
// 打开修改字典弹窗
const handleUpdate = (row: any) => {
	state.editTitle = '修改分类'
	dicDialogRef.value?.openDialog('edit', row);
};
// 打开修改字典弹窗
const handleDetailUpdate = (row: any) => {
	state.editTitle = '修改字典'
	dicDialogRef.value?.openDialog('detailEdit', row);
};
// 删除字典
const handleDelete = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除字典名称：“${row.name}”，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(async () => {
			await request.post("/api/base/dict/delete", [row.id])
			handleQuery();
			ElMessage.success('删除成功');
		})
		.catch(() => { });
};
// 删除字典
const handleDetailDelete = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除字典名称：“${row.label}”，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(async () => {
			await request.post("/api/base/dictDetails/delete", [row.id])
			handleDetailQuery();
			ElMessage.success('删除成功');
		})
		.catch(() => { });
};

// 改变页面容量
const handleSizeChange = (val: number) => {
	state.tableParams.MaxResultCount = val;
	handleQuery();
};
// 改变页码序号
const handleCurrentChange = (val: number) => {
	state.page = val;
	handleQuery();
};

const handleRowClick = (row: any) => {
	state.detailTableParams.Pid = row.id
	handleDetailQuery()
}

// 页面加载时
onMounted(() => {
	handleQuery();
});
</script>
