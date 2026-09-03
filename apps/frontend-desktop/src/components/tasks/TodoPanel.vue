<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchTodos, confirmTodo } from '@/api/messages'
import type { TodoItem } from '@/types'
import EmptyState from '@/components/EmptyState.vue'

const todos = ref<TodoItem[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    todos.value = await fetchTodos()
  } finally {
    loading.value = false
  }
}

async function handleConfirm(todo: TodoItem) {
  const updated = await confirmTodo(todo.id)
  const index = todos.value.findIndex((t) => t.id === todo.id)
  if (index !== -1) todos.value[index] = updated
}

defineExpose({ reload: load })
onMounted(load)
</script>

<template>
  <aside class="todo-panel">
    <div class="todo-panel__title">待办事项</div>
    <template v-if="!loading">
      <div v-for="todo in todos" :key="todo.id" class="todo-item">
        <p class="todo-item__content">{{ todo.content }}</p>
        <div class="todo-item__meta">
          <span v-if="todo.assignee">{{ todo.assignee }}</span>
          <span v-if="todo.dueDate">{{ new Date(todo.dueDate).toLocaleDateString('zh-CN') }}</span>
        </div>
        <button
          v-if="todo.aiExtracted && !todo.confirmedByUser"
          class="todo-item__confirm"
          @click="handleConfirm(todo)"
        >
          待确认 · 点击确认
        </button>
        <span v-else-if="todo.confirmedByUser" class="todo-item__done">已确认</span>
      </div>
      <EmptyState v-if="todos.length === 0" text="暂无待办" />
    </template>
  </aside>
</template>

<style scoped lang="scss">
@import '@/styles/tokens.scss';

.todo-panel {
  background: $opc-bg-card;
  border: 1px solid $opc-border-color;
  border-radius: $opc-radius-card;
  box-shadow: $opc-shadow-sm;
  padding: $opc-spacing-md;
  display: flex;
  flex-direction: column;
  gap: $opc-spacing-sm;

  &__title {
    font-size: $opc-font-base;
    font-weight: 700;
  }
}

.todo-item {
  background: $opc-bg-subtle;
  border-radius: $opc-radius-card-sm;
  padding: $opc-spacing-sm;

  &__content {
    margin: 0 0 6px;
    font-size: $opc-font-sm;
  }

  &__meta {
    display: flex;
    gap: $opc-spacing-xs;
    font-size: 11px;
    color: $opc-color-text-secondary;
    margin-bottom: 4px;
  }

  &__confirm {
    font-size: $opc-font-xs;
    color: $opc-color-accent;
    font-weight: 600;
    text-decoration: underline;
  }

  &__done {
    font-size: $opc-font-xs;
    color: $opc-color-success;
  }
}
</style>
