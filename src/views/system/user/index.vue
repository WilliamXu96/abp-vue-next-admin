<template>
	<div class="system-user-container layout-padding">
		<el-row :gutter="8" style="width: 100%">
			<el-col :span="4" :xs="24">
				<el-card shadow="hover" :body-style="{ paddingBottom: '0' }">
					<div class="card-header">
						<el-form-item>
							<el-input placeholder="搜索..." clearable @keyup.enter="getOrgs" v-model="state.orgFilter" />
						</el-form-item>
					</div>
					<hr style="height:1px;border:none;border-top:1px solid #e0deda;" />
					<div style="margin-bottom: 45px">
						<el-tree :data="state.orgData" :load="getOrgs"
							:props="{ id: 'id', pid: 'pid', label: 'name', expand: 'expand', children: 'children', isLeaf: 'leaf' }"
							:expand-on-click-node="false" lazy @node-click="handleNodeClick" style="margin-top:15px" />
					</div>
				</el-card>
			</el-col>

			<el-col :span="20" :xs="24">
				<el-card shadow="hover" :body-style="{ paddingBottom: '0' }">
					<el-form :model="state.tableParams" ref="queryForm" :inline="true">
						<el-form-item>
							<el-input placeholder="搜索..." @keyup.enter="handleQuery"
								v-model="state.tableParams.Filter" />
						</el-form-item>
						<el-form-item>
							<el-button type="primary" icon="ele-Search" @click="handleQuery"> 查询
							</el-button>
							<el-button icon="ele-Plus" @click="handleCreate" v-auth="'AbpIdentity.Users.Create'"> 新增 </el-button>
						</el-form-item>
					</el-form>
				</el-card>

				<el-card shadow="hover" style="margin-top: 8px">
					<el-table :data="state.userData" style="width: 100%" v-loading="state.loading" border>
						<el-table-column type="selection" width="44px"></el-table-column>
						<el-table-column label="用户名" prop="userName" sortable="custom" align="center">
							<template #default="scope">
								<span class="link-type" @click="">{{ scope.row.userName }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="organizationNames" label="所属机构" show-overflow-tooltip />
						<el-table-column prop="email" label="邮箱" show-overflow-tooltip />
						<el-table-column prop="phoneNumber" label="电话" show-overflow-tooltip />
						<!-- <el-table-column label="性别" width="70" align="center" show-overflow-tooltip>
								<template #default="scope">
									<el-tag type="success" v-if="scope.row.sex === 1"> 男 </el-tag>
									<el-tag type="danger" v-else> 女 </el-tag>
								</template>
							</el-table-column> -->
						<!-- <el-table-column label="状态" width="70" align="center" show-overflow-tooltip>
								<template #default="scope">
									<el-switch v-model="scope.row.status" :active-value="1" :inactive-value="2"
										size="small" />
								</template>
							</el-table-column> -->
						<!-- <el-table-column prop="orderNo" label="排序" width="70" align="center" show-overflow-tooltip />
							<el-table-column prop="createTime" label="修改时间" width="160" show-overflow-tooltip />
							<el-table-column prop="remark" label="备注" show-overflow-tooltip /> -->
						<el-table-column label="操作" width="140" align="center" fixed="right" show-overflow-tooltip>
							<template #default="scope">
								<el-button icon="ele-Edit" size="small" text type="primary"
									@click="handleUpdate(scope.row)"> 编辑 </el-button>
								<el-button icon="ele-Delete" size="small" text type="primary"
									@click="handleDelete(scope.row)"> 删除 </el-button>
								<!-- <el-dropdown>
									<el-button icon="ele-MoreFilled" size="small" text type="primary"
										style="padding-left: 12px" />
									<template #dropdown>
										<el-dropdown-menu>
											<el-dropdown-item icon="ele-RefreshLeft"> 重置密码 </el-dropdown-item>
										</el-dropdown-menu>
									</template>
								</el-dropdown> -->
							</template>
						</el-table-column>
					</el-table>
					<el-pagination class="mt15" v-model:currentPage="state.page"
						v-model:page-size="state.tableParams.MaxResultCount" :total="state.totalCount"
						:page-sizes="[10, 20, 50, 100]" small background @size-change="handleSizeChange"
						@current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper" />
				</el-card>
			</el-col>
		</el-row>
		<EditUser ref="editUserRef" @refresh="handleQuery()" />
	</div>
</template>

<script setup lang="ts" name="user">
import { reactive, onMounted, ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import EditUser from '/@/views/system/user/editUser.vue';
import request from '/@/utils/request';

// 定义变量内容
const editUserRef = ref();
const state = reactive({
	orgData: [],
	userData: [],
	totalCount: 0,
	loading: false,
	orgFilter: '',
	page: 1,
	tableParams: {
		OrganizationId: null,
		Filter: "",
		Sorting: "",
		SkipCount: 0,
		MaxResultCount: 10
	},
	treeParams: {
		Filter: null,
		Id: null
	},
	editUserTitle: '',
});

// 左侧组织机构树形懒加载
const getOrgs = async (node, resolve) => {
	if (typeof node !== "object") {
		if (node) {
			state.treeParams.Filter = node;
		}
	} else if (node.level !== 0) {
		state.treeParams.Id = node.data.id;
	}
	await request.get("/api/base/orgs/loadOrgs", { params: state.treeParams })
		.then((response) => {
			if (resolve) {
				resolve(response.items);
			} else {
				state.orgData = response.items;
			}
		});
}

// 左侧机构树点击事件
const handleNodeClick = async (data) => {
	state.tableParams.OrganizationId = data.id
	handleQuery()
}

// 查询操作
const handleQuery = async () => {
	state.loading = true;
	state.tableParams.SkipCount = (state.page - 1) * state.tableParams.MaxResultCount;
	var response = await request.get('/api/base/user', { params: state.tableParams })
	state.userData = response.items;
	state.totalCount = response.totalCount;
	state.loading = false;
};

// 打开新增页面
const handleCreate = () => {
	editUserRef.value?.openDialog();
};

// 打开编辑页面
const handleUpdate = (row: any) => {
	editUserRef.value?.openDialog('edit', row);
};

//删除用户
const handleDelete = (row: any) => {
	ElMessageBox.confirm(`确定删除账号：【${row.userName}】?`, '提示', {
		confirmButtonText: '确定',
		cancelButtonText: '取消',
		type: 'warning',
	})
		.then(async () => {
			await request.delete("/api/identity/users/" + row.id);
			handleQuery();
			ElMessage.success('删除成功');
		})
		.catch(() => { });
}

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

// 页面加载时
onMounted(() => {
	handleQuery();
});
</script>

<style scoped lang="scss">
.system-user-container {
	:deep(.el-card__body) {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: auto;

		.el-table {
			flex: 1;
		}
	}
}
</style>
