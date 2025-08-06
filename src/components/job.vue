<template>
  <!-- 根容器，通常由父组件提供 -->
  <div class="job-management-container">
    <!-- 1. 功能触发按钮 (由父组件放置) -->
    <!-- <el-button size="small" type="primary" @click="openDrawer">
      <i class="el-icon-setting" /> Job管理
    </el-button> -->

    <!-- 2. 抽屉组件：封装了所有Job管理功能 -->
    <el-drawer title="设置Job" :visible.sync="drawerVisible" direction="rtl" size="60%" @close="handleDrawerClose">
      <div class="drawer-content">

        <!-- 2.1 新增Job的表单 -->
        <el-form :model="jobForm" :rules="jobFormRules" ref="jobForm" label-width="80px" inline>
          <el-form-item label="材质" prop="material">
            <el-input v-model="jobForm.material" placeholder="请输入材质" size="small" clearable></el-input>
          </el-form-item>
          <el-form-item label="厚度1" prop="thickness1">
            <el-input v-model.number="jobForm.thickness1" placeholder="请输入厚度1" size="small" type="number"></el-input>
          </el-form-item>
          <el-form-item label="厚度2" prop="thickness2">
            <el-input v-model.number="jobForm.thickness2" placeholder="请输入厚度2" size="small" type="number"></el-input>
          </el-form-item>
          <el-form-item label="Job编号" prop="job_number">
            <el-input v-model="jobForm.job_number" placeholder="请输入Job编号" size="small" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAddJob" size="small" icon="el-icon-plus">添加/覆盖</el-button>
            <el-button @click="resetJobForm" size="small" icon="el-icon-refresh">重置</el-button>
          </el-form-item>
        </el-form>

        <el-divider></el-divider>

        <!-- 2.2 Job数据显示表格与批量操作 -->
        <div class="table-toolbar">
          <el-button type="danger" size="small" @click="handleDeleteSelectedJobs" :disabled="selectedJobs.length === 0" icon="el-icon-delete">
            删除选中
          </el-button>
        </div>

        <el-table v-loading="loading" :data="jobList" style="width: 100%" border @selection-change="handleJobSelectionChange">
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column prop="material" label="材质" sortable></el-table-column>
          <el-table-column prop="thickness1" label="厚度1" sortable></el-table-column>
          <el-table-column prop="thickness2" label="厚度2" sortable></el-table-column>
          <el-table-column prop="job_number" label="Job编号" sortable></el-table-column>
          <el-table-column label="操作" align="center" width="100px">
            <template slot-scope="scope">
              <!-- 可以加入编辑功能 -->
              <!-- <el-button type="text" size="small" @click="handleEditJob(scope.row)">编辑</el-button> -->
              <el-button type="text" size="small" @click="handleDeleteJob(scope.row)" style="color: #F56C6C;">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 2.3 分页组件 -->
        <el-pagination 
          class="pagination"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange">
        </el-pagination>
      </div>
    </el-drawer>
  </div>
</template><script>
// 【第一步】: 确保从您的真实API文件中导入了这三个核心方法
// 请根据您的项目结构，核对并修改下面的路径
import { GetJobRulesList, AddJobRule, DeleteJobRules } from '@/views/frame/api';

export default {
  name: 'JobManagement',
  data() {
    return {
      // 控制抽屉的显示/隐藏
      drawerVisible: false,
      // 表格加载状态
      loading: false,
      // 新增/编辑 Job 的表单数据
      jobForm: {
        material: '',
        thickness1: null,
        thickness2: null,
        job_number: ''
      },
      // 表单校验规则
      jobFormRules: {
        material: [{ required: true, message: '材质不能为空', trigger: 'blur' }],
        thickness1: [{ required: true, message: '厚度1不能为空', trigger: 'blur' }],
        thickness2: [{ required: true, message: '厚度2不能为空', trigger: 'blur' }],
        job_number: [{ required: true, message: 'Job编号不能为空', trigger: 'blur' }]
      },
      // 表格显示的数据
      jobList: [],
      // 表格中被勾选的行
      selectedJobs: [],
      // 分页状态
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    };
  },
  methods: {
    // --- 外部调用方法 ---
    /**
     * 打开Job管理抽屉 (此方法由父组件调用)
     */
    openDrawer() {
      this.drawerVisible = true;
      this.fetchJobData(); // 打开时自动加载第一页数据
    },

    // --- 数据请求 ---
    /**
     * 核心方法：获取Job列表数据
     */
    async fetchJobData() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize
        };
        // 调用真实的API
        const res = await GetJobRulesList(params);

        // 健壮性检查，确保返回的数据结构正确
        if (res && Array.isArray(res.results)) {
          this.jobList = res.results;
          this.pagination.total = res.count;
        } else {
          console.warn("API返回的数据结构无法识别，请检查后端接口！", res);
          this.jobList = [];
          this.pagination.total = 0;
        }
      } catch (error) {
        console.error('获取Job列表出错:', error);
        this.$message.error('获取Job列表出错，请检查网络或联系管理员');
      } finally {
        this.loading = false;
      }
    },

    // --- 表单与增改操作 ---
    /**
     * 处理“添加/覆盖”按钮点击事件
     */
    handleAddJob() {
      this.$refs.jobForm.validate(async (valid) => {
        if (!valid) {
          this.$message.warning('请检查表单输入项！');
          return false;
        }

        const jobData = {
          material: this.jobForm.material.trim(),
          thickness1: this.jobForm.thickness1,
          thickness2: this.jobForm.thickness2,
          job_number: this.jobForm.job_number
        };

        // 检查是否存在重复的Job (材质相同，厚度对相同)
        const duplicateJob = this.jobList.find(job => this.isJobDuplicate(job, jobData));

        if (duplicateJob) {
          // 如果重复，询问是否覆盖
          this.handleDuplicateJob(duplicateJob, jobData);
        } else {
          // 如果不重复，直接添加
          this.createJob(jobData);
        }
      });
    },

    /**
     * 检查 Job 是否重复的辅助函数
     * @param {object} existingJob - 已存在的Job
     * @param {object} newJobData - 新的Job数据
     * @returns {boolean}
     */
    isJobDuplicate(existingJob, newJobData) {
      const formMaterial = newJobData.material.toLowerCase();
      const jobMaterial = (existingJob.material || '').trim().toLowerCase();
      
      const thicknessMatch = 
        (existingJob.thickness1 === newJobData.thickness1 && existingJob.thickness2 === newJobData.thickness2) ||
        (existingJob.thickness1 === newJobData.thickness2 && existingJob.thickness2 === newJobData.thickness1);

      return jobMaterial === formMaterial && thicknessMatch;
    },

    /**
     * 处理重复Job的覆盖逻辑
     */
    handleDuplicateJob(duplicateJob, newJobData) {
      this.$confirm('该材质和厚度组合的Job已存在，是否要覆盖其Job编号?', '提示', {
        confirmButtonText: '覆盖',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 先删除旧的
          await DeleteJobRules({ ids: [duplicateJob.id] });
          // 再添加新的
          await AddJobRule(newJobData);
          this.$message.success('覆盖成功！');
          await this.fetchJobData(); // 刷新列表
          this.resetJobForm();
        } catch (error) {
          console.error('覆盖Job出错:', error);
          this.$message.error('覆盖操作失败');
          await this.fetchJobData(); // 即使失败也要刷新，确保数据一致性
        }
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },

    /**
     * 执行创建新Job的API调用
     */
    async createJob(jobData) {
      try {
        await AddJobRule(jobData);
        this.$message.success('添加Job成功！');
        // 添加成功后，跳转到最后一页查看新数据（可选，体验更好）
        this.pagination.currentPage = Math.ceil((this.pagination.total + 1) / this.pagination.pageSize);
        await this.fetchJobData();
        this.resetJobForm();
      } catch (error) {
        console.error('添加Job出错:', error);
        this.$message.error('添加Job出错');
      }
    },

    /**
     * 重置表单
     */
    resetJobForm() {
      this.$nextTick(() => {
        if (this.$refs.jobForm) {
          this.$refs.jobForm.resetFields();
        }
      });
    },
    
    // --- 表格与删除操作 ---
    /**
     * 处理表格行勾选变化
     */
    handleJobSelectionChange(selection) {
      this.selectedJobs = selection;
    },

    /**
     * 处理批量删除
     */
    handleDeleteSelectedJobs() {
      this.$confirm(`确定要删除选中的 ${this.selectedJobs.length} 条Job吗？`, '提示', {
        type: 'warning'
      }).then(async () => {
        const idsToDelete = this.selectedJobs.map(job => job.id);
        await this.deleteJobsByIds(idsToDelete);
      }).catch(() => { /* 用户取消操作 */ });
    },

    /**
     * 处理单行删除
     */
    handleDeleteJob(row) {
      this.$confirm(`确定要删除 Job [${row.job_number || row.id}] 吗？`, '提示', {
        type: 'warning'
      }).then(async () => {
        await this.deleteJobsByIds([row.id]);
      }).catch(() => { /* 用户取消操作 */ });
    },

    /**
     * 执行删除操作的API调用
     * @param {Array<number>} ids - 要删除的ID数组
     */
    async deleteJobsByIds(ids) {
      try {
        await DeleteJobRules({ ids: ids });
        this.$message.success('删除成功！');

        // 智能翻页：如果当前页被删空，则返回上一页
        const remaining = this.jobList.length - ids.length;
        if (remaining === 0 && this.pagination.currentPage > 1) {
          this.pagination.currentPage--;
        }
        await this.fetchJobData();
      } catch (error) {
        console.error('删除Job出错:', error);
        this.$message.error('删除Job出错');
      }
    },
    
    // --- 分页与抽屉事件 ---
    /**
     * 处理每页显示条数变化
     */
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize;
      this.pagination.currentPage = 1; // 回到第一页
      this.fetchJobData();
    },
    /**
     * 处理页码变化
     */
    handlePageChange(newPage) {
      this.pagination.currentPage = newPage;
      this.fetchJobData();
    },
    /**
     * 处理抽屉关闭事件
     */
    handleDrawerClose() {
      this.resetJobForm();
      this.selectedJobs = [];
    }
  }
};
</script>