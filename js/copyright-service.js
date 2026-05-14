const COPYRIGHT_TYPES = {
  ORIGINAL: 'original',
  REPRINT: 'reprint',
  AUTHORIZED: 'authorized',
  PUBLIC_DOMAIN: 'public_domain',
  CC: 'cc'
};

const INFRINGEMENT_TYPES = {
  PLAGIARISM: 'plagiarism',
  PIRACY: 'piracy',
  IMPROPER_CITATION: 'improper_citation'
};

const REPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

const RESOLUTION_RESULT = {
  RESTORE: 'restore',
  DELETE: 'delete',
  WARN: 'warn'
};

const STORAGE_KEY = 'liuqingju_copyright_reports';

function getStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : { reports: [], stats: { total: 0, pending: 0, resolved: 0, rejected: 0 } };
}

function setStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
  return 'RPT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function checkLoginStatus() {
  const currentUser = localStorage.getItem('liuqingju_current_user');
  return currentUser ? JSON.parse(currentUser) : null;
}

function getResource(resourceId) {
  const resources = localStorage.getItem('liuqingju_resources');
  if (!resources) return null;
  const resourceList = JSON.parse(resources);
  return resourceList.find(r => r.id === resourceId) || null;
}

function updateResourceStatus(resourceId, status) {
  const resources = localStorage.getItem('liuqingju_resources');
  if (!resources) return false;
  const resourceList = JSON.parse(resources);
  const index = resourceList.findIndex(r => r.id === resourceId);
  if (index === -1) return false;
  resourceList[index].status = status;
  resourceList[index].updatedAt = new Date().toISOString();
  localStorage.setItem('liuqingju_resources', JSON.stringify(resourceList));
  return true;
}

function createNotification(recipientId, type, title, content, relatedReportId) {
  const notifications = localStorage.getItem('liuqingju_notifications');
  const notificationList = notifications ? JSON.parse(notifications) : [];
  const notification = {
    id: 'NTF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    recipientId,
    type,
    title,
    content,
    relatedReportId,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notificationList.unshift(notification);
  localStorage.setItem('liuqingju_notifications', JSON.stringify(notificationList));
  return notification;
}

function sendEmailNotification(email, subject, content) {
  // 生产环境不应记录敏感信息
  console.log('[Email] Email notification sent');
  return { success: true, message: 'Email notification sent' };
}

async function submitReport(data) {
  const user = checkLoginStatus();
  if (!user) {
    throw new Error('请先登录后再提交投诉');
  }

  const { resourceId, reason, description, evidence, infringementType } = data;

  if (!resourceId || !reason || !description || !infringementType) {
    throw new Error('请填写完整的投诉信息');
  }

  const resource = getResource(resourceId);
  if (!resource) {
    throw new Error('投诉的资源不存在');
  }

  if (resource.uploaderId === user.id) {
    throw new Error('不能投诉自己上传的资源');
  }

  const storage = getStorage();
  const existingReport = storage.reports.find(
    r => r.resourceId === resourceId && r.reporterId === user.id && r.status !== REPORT_STATUS.RESOLVED && r.status !== REPORT_STATUS.REJECTED
  );

  if (existingReport) {
    throw new Error('您已对该资源提交过投诉，请等待处理结果');
  }

  const report = {
    id: generateId(),
    resourceId,
    resourceTitle: resource.title,
    resourceUploaderId: resource.uploaderId,
    resourceUploaderName: resource.uploaderName,
    reporterId: user.id,
    reporterName: user.name,
    reporterEmail: user.email,
    copyrightType: resource.copyrightType,
    infringementType,
    reason,
    description,
    evidence: evidence || [],
    status: REPORT_STATUS.PENDING,
    autoAction: 'resource_takedown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  storage.reports.push(report);

  updateResourceStatus(resourceId, 'under_review');

  createNotification(
    resource.uploaderId,
    'copyright_report_submitted',
    '资源被投诉侵权',
    `您的资源"${resource.title}"收到了侵权投诉，原因：${reason}`,
    report.id
  );

  storage.stats.total++;
  storage.stats.pending++;

  setStorage(storage);

  console.log(`[Copyright Report] 新投诉已提交: ${report.id}`);

  return {
    success: true,
    reportId: report.id,
    message: '投诉提交成功，资源已被自动下架',
    report
  };
}

async function getReports(status) {
  const user = checkLoginStatus();
  if (!user) {
    throw new Error('请先登录');
  }

  const storage = getStorage();

  let reports = storage.reports.filter(report => {
    if (user.role === 'admin') {
      return true;
    }
    return report.reporterId === user.id || report.resourceUploaderId === user.id;
  });

  if (status) {
    reports = reports.filter(r => r.status === status);
  }

  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return reports.map(report => ({
    ...report,
    statusText: getStatusText(report.status),
    infringementText: getInfringementText(report.infringementType),
    copyrightText: getCopyrightText(report.copyrightType)
  }));
}

function getStatusText(status) {
  const statusMap = {
    [REPORT_STATUS.PENDING]: '待处理',
    [REPORT_STATUS.PROCESSING]: '处理中',
    [REPORT_STATUS.RESOLVED]: '已解决',
    [REPORT_STATUS.REJECTED]: '已驳回'
  };
  return statusMap[status] || status;
}

function getInfringementText(type) {
  const typeMap = {
    [INFRINGEMENT_TYPES.PLAGIARISM]: '抄袭',
    [INFRINGEMENT_TYPES.PIRACY]: '盗版',
    [INFRINGEMENT_TYPES.IMPROPER_CITATION]: '引用不当'
  };
  return typeMap[type] || type;
}

function getCopyrightText(type) {
  const typeMap = {
    [COPYRIGHT_TYPES.ORIGINAL]: '原创',
    [COPYRIGHT_TYPES.REPRINT]: '转载',
    [COPYRIGHT_TYPES.AUTHORIZED]: '授权',
    [COPYRIGHT_TYPES.PUBLIC_DOMAIN]: '公共领域',
    [COPYRIGHT_TYPES.CC]: 'CC协议'
  };
  return typeMap[type] || type;
}

async function resolveReport(reportId, result, note) {
  const user = checkLoginStatus();
  if (!user) {
    throw new Error('请先登录');
  }

  if (user.role !== 'admin') {
    throw new Error('只有管理员可以处理投诉');
  }

  const storage = getStorage();
  const reportIndex = storage.reports.findIndex(r => r.id === reportId);

  if (reportIndex === -1) {
    throw new Error('投诉记录不存在');
  }

  const report = storage.reports[reportIndex];

  if (report.status === REPORT_STATUS.RESOLVED || report.status === REPORT_STATUS.REJECTED) {
    throw new Error('该投诉已被处理，无法重复操作');
  }

  const resource = getResource(report.resourceId);
  if (!resource) {
    throw new Error('关联的资源已不存在');
  }

  report.resolvedBy = user.id;
  report.resolvedByName = user.name;
  report.resolutionResult = result;
  report.resolutionNote = note;
  report.updatedAt = new Date().toISOString();

  let notifyContent = '';

  if (result === RESOLUTION_RESULT.RESTORE) {
    report.status = REPORT_STATUS.RESOLVED;
    updateResourceStatus(report.resourceId, 'published');
    notifyContent = `您的资源"${resource.title}"经审核后已恢复上架`;
  } else if (result === RESOLUTION_RESULT.DELETE) {
    report.status = REPORT_STATUS.RESOLVED;
    updateResourceStatus(report.resourceId, 'deleted_permanently');
    notifyContent = `您的资源"${resource.title}"因侵权已被永久删除`;
    storage.stats.resolved++;
    storage.stats.pending--;
  } else if (result === RESOLUTION_RESULT.WARN) {
    report.status = REPORT_STATUS.RESOLVED;
    updateResourceStatus(report.resourceId, 'published_with_warning');
    notifyContent = `您的资源"${resource.title}"已被警告，请立即修改或删除侵权内容`;
    storage.stats.resolved++;
    storage.stats.pending--;
  }

  createNotification(
    report.resourceUploaderId,
    'copyright_report_resolved',
    '侵权投诉处理结果通知',
    notifyContent,
    report.id
  );

  createNotification(
    report.reporterId,
    'copyright_report_resolved',
    '您的侵权投诉已处理',
    `您对"${resource.title}"的投诉已处理，结果：${result === RESOLUTION_RESULT.RESTORE ? '恢复资源' : result === RESOLUTION_RESULT.DELETE ? '删除资源' : '警告处理'}`,
    report.id
  );

  if (report.reporterEmail) {
    const emailSubject = `侵权投诉处理结果 - ${resource.title}`;
    const emailContent = `
尊敬的用户 ${report.reporterName}：

您好！您提交的侵权投诉（编号：${report.id}）已处理完成。

资源名称：${resource.title}
处理结果：${result === RESOLUTION_RESULT.RESTORE ? '恢复资源' : result === RESOLUTION_RESULT.DELETE ? '删除资源' : '警告处理'}
${note ? `处理备注：${note}` : ''}

感谢您对版权保护的支持！

此致
敬礼
`;
    sendEmailNotification(report.reporterEmail, emailSubject, emailContent);
  }

  storage.reports[reportIndex] = report;
  setStorage(storage);

  console.log(`[Copyright Report] 投诉已处理: ${reportId}, 结果: ${result}`);

  return {
    success: true,
    message: '投诉处理成功',
    report
  };
}

async function getReportStats() {
  const user = checkLoginStatus();
  if (!user) {
    throw new Error('请先登录');
  }

  const storage = getStorage();

  const stats = {
    total: storage.stats.total,
    pending: storage.stats.pending,
    processing: 0,
    resolved: storage.stats.resolved,
    rejected: storage.stats.rejected
  };

  storage.reports.forEach(report => {
    if (report.status === REPORT_STATUS.PROCESSING) {
      stats.processing++;
    }
  });

  const byInfringementType = {
    [INFRINGEMENT_TYPES.PLAGIARISM]: 0,
    [INFRINGEMENT_TYPES.PIRACY]: 0,
    [INFRINGEMENT_TYPES.IMPROPER_CITATION]: 0
  };

  storage.reports.forEach(report => {
    if (byInfringementType.hasOwnProperty(report.infringementType)) {
      byInfringementType[report.infringementType]++;
    }
  });

  const byResult = {
    [RESOLUTION_RESULT.RESTORE]: 0,
    [RESOLUTION_RESULT.DELETE]: 0,
    [RESOLUTION_RESULT.WARN]: 0,
    pending: 0
  };

  storage.reports.forEach(report => {
    if (report.status === REPORT_STATUS.RESOLVED || report.status === REPORT_STATUS.REJECTED) {
      if (report.resolutionResult && byResult.hasOwnProperty(report.resolutionResult)) {
        byResult[report.resolutionResult]++;
      }
    } else {
      byResult.pending++;
    }
  });

  const recentReports = storage.reports
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(report => ({
      id: report.id,
      resourceTitle: report.resourceTitle,
      infringementType: report.infringementType,
      status: report.status,
      createdAt: report.createdAt
    }));

  return {
    overview: stats,
    byInfringementType,
    byResult,
    recentReports,
    lastUpdated: new Date().toISOString()
  };
}

export {
  COPYRIGHT_TYPES,
  INFRINGEMENT_TYPES,
  REPORT_STATUS,
  RESOLUTION_RESULT,
  submitReport,
  getReports,
  resolveReport,
  getReportStats
};
