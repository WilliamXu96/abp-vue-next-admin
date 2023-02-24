<template>
	<div class="system-menu-container layout-pd">
		<el-card shadow="hover" :body-style="{ paddingBottom: '0' }">
			<el-form :inline="true">
				<el-form-item>
					<el-input placeholder="搜索..." @keyup.enter="handleQuery" v-model="state.tableParams.Filter" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="ele-Search" @click="handleQuery"> 查询
					</el-button>
					<el-button icon="ele-Plus" @click="handleCreate"> 新增 </el-button>
				</el-form-item>
			</el-form>
		</el-card>
		<el-card shadow="hover" style="margin-top: 8px">
			<el-table :data="state.list" v-loading="state.loading" style="width: 100%" row-key="path"
				:tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
				<el-table-column label="菜单名" prop="label" show-overflow-tooltip />
				<el-table-column label="图标" prop="icon" show-overflow-tooltip />
				<el-table-column label="排序" prop="sort" />
				<el-table-column label="类型" show-overflow-tooltip :formatter="categoryFormat" />
				<el-table-column label="组件路径" prop="component" show-overflow-tooltip />
				<el-table-column label="操作" show-overflow-tooltip width="140" align="center">
					<template #default="scope">
						<el-button icon="ele-Edit" size="small" text type="primary" @click="handleUpdate(scope.row)"> 编辑
						</el-button>
						<el-button icon="ele-Delete" size="small" text type="primary" @click="handleDelete(scope.row)"> 删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>
		<EditMenu ref="editMenuRef" @refresh="handleQuery()" :menuData="state.list" />
	</div>
</template>

<script setup lang="ts" name="menu">
import { ref, onMounted, reactive } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import { useRoutesList } from '/@/stores/routesList';
import EditMenu from '/@/views/system/menu/editMenu.vue';
import request from '/@/utils/request';
// import { setBackEndControlRefreshRoutes } from "/@/router/backEnd";

// 引入组件


// 定义变量内容
const stores = useRoutesList();
const { routesList } = storeToRefs(stores);
const editMenuRef = ref();
const state = reactive({
	tableData: {
		data: [] as RouteRecordRaw[],
		loading: true,
	},
	list: [],
	loading: false,
	tableParams: {
		Filter: "",
		Sorting: "",
		SkipCount: 0,
		MaxResultCount: 10
	},
});

// 查询操作
const handleQuery = async () => {
	state.loading = true;
	var response = await request.get('/api/base/menu/all', { params: state.tableParams })
	state.list = response.items.filter(_ => _.pid == null)
	setChildren(state.list, response.items)
	state.loading = false;
};

const setChildren = (roots, items) => {
	roots.forEach(element => {
		items.forEach(item => {
			if (item.pid == element.id) {
				if (!element.children)
					element.children = []
				element.children.push(item);
			}
		});
		if (element.children) {
			setChildren(element.children, items);
		}
	});
}

// 打开新增菜单弹窗
const handleCreate = () => {
	editMenuRef.value.openDialog();
};
// 打开编辑菜单弹窗
const handleUpdate = (row: any) => {
	editMenuRef.value.openDialog('edit', row);
};
// 删除当前行
const handleDelete = (row: any) => {
	ElMessageBox.confirm(`此操作将永久删除菜单:${row.label}, 是否继续?`, '提示', {
		confirmButtonText: '删除',
		cancelButtonText: '取消',
		type: 'warning',
	}).then(async () => {
		await request.post("/api/base/menu/delete", [row.id]);
		handleQuery();
		ElMessage.success('删除成功');
	})
		.catch(() => { });
};

const categoryFormat = (row: any, column: any) => {
	if (row.categoryId == 1)
		return '菜单'
	if (row.categoryId == 1)
		return '按钮'
};

// 页面加载时
onMounted(() => {
	handleQuery();
});
</script>
