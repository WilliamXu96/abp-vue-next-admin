<template>
	<div class="system-role-container layout-padding">
		<el-row :gutter="8" style="width: 100%">
			<el-col :span="12" :xs="24">
				<el-card shadow="hover">
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

					<el-table :data="state.data" v-loading="state.loading" style="width: 100%" highlight-current-row
						@row-click="handleRowClick">
						<el-table-column prop="name" label="角色名" show-overflow-tooltip></el-table-column>
						<el-table-column prop="isDefault" label="默认" show-overflow-tooltip>
							<template #default="scope">
								<el-tag type="success" v-if="scope.row.isDefault">是</el-tag>
								<el-tag type="info" v-else>否</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="isPublic" label="公共" show-overflow-tooltip>
							<template #default="scope">
								<el-tag type="success" v-if="scope.row.isPublic">是</el-tag>
								<el-tag type="info" v-else>否</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
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
				<el-card shadow="hover">
					<el-form :model="state.tableParams" ref="queryForm" :inline="true">
						<el-form-item>
							<el-button icon="ele-Edit" text type="primary" @click="handlePermissionSave"
								:disabled="!state.selection.id" :loading="state.savePerLoading"> 修改角色菜单 </el-button>
						</el-form-item>
					</el-form>
					<el-tree ref="treeRef" :data="state.menuData" node-key="id" show-checkbox @check="checkNode"
					:check-strictly="true" :props="{ children: 'children', label: 'label' }" icon="ele-Menu" highlight-current />
				</el-card>
			</el-col>
		</el-row>

		<EditRole ref="editRoleRef" @refresh="handleQuery()" />
	</div>
</template>

<script setup lang="ts" name="systemRole">
import { defineAsyncComponent, reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import type { ElTree } from 'element-plus';
import EditRole from '/@/views/system/role/editRole.vue'
import request from '/@/utils/request';


// 定义变量内容
const editRoleRef = ref();
const treeRef = ref<InstanceType<typeof ElTree>>();
const state = reactive({
	data: [],
	menuData: [] as any,
	totalCount: 0,
	page: 1,
	loading: false,
	savePerLoading: false,
	tableParams: {
		Filter: "",
		Sorting: "",
		SkipCount: 0,
		MaxResultCount: 10
	},
	selection: {} as any
});
// 初始化表格数据
const handleQuery = async () => {
	state.loading = true;
	state.tableParams.SkipCount = (state.page - 1) * state.tableParams.MaxResultCount;
	var response = await request.get('/api/identity/roles', { params: state.tableParams })
	state.data = response.items;
	state.totalCount = response.totalCount;
	state.loading = false;
};

// 加载组织机构树形
const loadMenuTree = async () => {
	state.menuData = []
	const res = await request.get('/api/base/role-menus/list');
	res.items.forEach((element) => {
		if (!element.pid) {
			element.hasChildren = element.leaf ? false : true;
			if (!element.leaf) {
				element.children = [];
			}
			state.menuData.push(element);
		}
	});
	setChildren(state.menuData, res.items);
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

const handleMenuQuery = async () => {
	treeRef.value?.setCheckedKeys([]); // 清空选中值
	var response = await request.get('/api/base/role-menus/' + state.selection.id)
	treeRef.value?.setCheckedKeys(response.items);
}
// 打开新增角色弹窗
const handleCreate = () => {
	editRoleRef.value?.openDialog('add');
};
// 打开修改角色弹窗
const handleUpdate = (row: any) => {
	editRoleRef.value?.openDialog('edit', row);
};
// 删除角色
const handleDelete = (row: any) => {
	ElMessageBox.confirm(`此操作将永久角色：“${row.name}”，是否继续?`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(async () => {
			await request.delete("/api/identity/roles/" + row.id)
			handleQuery();
			ElMessage.success('删除成功');
		})
		.catch(() => { });
};
const handlePermissionSave = async () => {
	state.savePerLoading = true;
	const params = { permissions: [] as any };
	const ids = treeRef.value?.getCheckedKeys() as Array<string>;
	state.menuData.forEach((element) => {
		if (element.permission) {
			if (ids.indexOf(element.id) > -1) {
				params.permissions.push({ name: element.permission, isGranted: true })
			} else {
				params.permissions.push({ name: element.permission, isGranted: false })
			}
		}
	});
	await request.put('/api/permission-management/permissions?providerName=R&providerKey=' + state.selection.id, params)
	await request.post('/api/base/role-menus/update', { roleId: state.selection.id, menuIds: ids });
	ElMessage.success('修改成功');
	state.savePerLoading = false
}
// 选中角色
const handleRowClick = (row: any) => {
	state.selection = row
	handleMenuQuery()
}
const checkNode = (data, state) => {
	// if (!data.pid) {
	// } else {
	// 	if (state.checkedKeys.indexOf(data.id) > -1) {
	// 		treeRef.value?.setChecked(data.pid, true, false);
	// 	}
	// }
}
// 改变页面容量
const handleSizeChange = (val: number) => {
	state.tableParams.MaxResultCount = val;
	handleQuery();
};
// 分页改变
const handleCurrentChange = (val: number) => {
	state.page = val;
	handleQuery();
};
// 页面加载时
onMounted(() => {
	handleQuery();
	loadMenuTree();
});
</script>

<style scoped lang="scss">
.system-role-container {
	.system-role-padding {
		padding: 15px;

		.el-table {
			flex: 1;
		}
	}
}
</style>
