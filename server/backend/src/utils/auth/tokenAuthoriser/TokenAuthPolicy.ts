export default {
  create_server_users: [['admin']],
  get_all_tasks: [['admin']],
  create_task: [['admin'], ['work_provider']],
  edit_task: [['task_edit_[id]']],
  get_microtask_summary_of_task: [],
  mark_task_complete: [],
  test_api: [['test_read_[id]', 'test_write_[id]'], ['admin']],
};
