// Определение Vue-компонента 'kanban-card'
Vue.component('kanban-card', {
    props: ['card', 'columnIndex', 'cardIndex'],
    template: `
      <div :class="{
          'card': true,
          'completed-on-time': card.status === 'Completed on time',
          'overdue': card.status === 'Overdue',
          'readonly': columnIndex === 3
        }">
        <div class="card-title">{{ card.title }}</div>
        <div class="card-date">Создано: {{ card.dateCreated }}</div>
        <div class="card-date">Последнее редактирование: {{ card.lastEdited }}</div>
        <div class="card-description">{{ card.description }}</div>
        <div class="card-deadline" v-if="card.deadline">Дедлайн: {{ card.deadline }}</div>
        <div class="card-priority" v-if="card.priority">Приоритет: {{ priorityText(card.priority) }}</div>
        <div class="card-status" v-if="card.status">Статус: 
          {{ columnIndex === 3 && card.status === 'Completed on time' ? 'Выполнено' : '' }}
          {{ columnIndex === 3 && card.status === 'Overdue' ? 'Просрочено' : '' }}
          {{ columnIndex !== 3 ? card.status : '' }}
        </div>
        <div class="card-actions">
          <button v-if="columnIndex !== 3" @click="editCard">Редактировать</button>
          <button v-if="columnIndex === 0" @click="deleteCard">Удалить</button>
          <button v-if="columnIndex === 0" @click="moveToInProgress">Дальше</button>
          <button v-if="columnIndex === 1" @click="moveToTesting">Дальше</button>
          <button v-if="columnIndex === 2" @click="moveToDone">Дальше</button>
          <button v-if="columnIndex === 2" @click="returnToInProgressWithReason">Назад</button>
        </div>
      </div>
    `,
    methods: {
      priorityText(priority) {
        if (priority === 1) return 'Высокий';
        if (priority === 2) return 'Средний';
        return 'Низкий';
      },
  
      editCard() {
        const updatedTitle = prompt('Редактировать заголовок', this.card.title);
        const updatedDescription = prompt('Редактировать описание', this.card.description);
        const updatedDeadline = prompt('Редактировать дедлайн', this.card.deadline);
  
        if (updatedTitle !== null && updatedDescription !== null && updatedDeadline !== null) {
          this.card.title = updatedTitle;
          this.card.description = updatedDescription;
          this.card.deadline = updatedDeadline;
          this.card.lastEdited = new Date().toLocaleString();
        }
      },
      deleteCard() {
        this.$emit('delete-card', this.columnIndex, this.cardIndex);
      },
      moveToInProgress() {
        this.$emit('move-to-in-progress', this.card, this.columnIndex, this.cardIndex);
      },
      moveToTesting() {
        this.$emit('move-to-testing', this.card, this.columnIndex, this.cardIndex);
      },
      moveToDone() {
        this.$emit('move-to-done', this.card, this.columnIndex, this.cardIndex);
      },
      returnToInProgressWithReason() {
        const inProgressIndex = 1;
        let returnReason = '';
  
        while (returnReason === '' || returnReason === null) {
          returnReason = prompt('Укажите причину возврата карточки:');
          if (returnReason === null) {
            return;
          }
          if (returnReason === '') {
            alert('Пожалуйста, укажите причину возврата.');
          }
        }
  
        const originalCardCopy = { ...this.card };
        this.$parent.columns[inProgressIndex].cards.push({
          title: originalCardCopy.title,
          description: originalCardCopy.description,
          deadline: originalCardCopy.deadline,
          dateCreated: originalCardCopy.dateCreated,
          lastEdited: originalCardCopy.lastEdited,
          returnReason: returnReason
        });
        this.$parent.columns[this.columnIndex].cards.splice(this.cardIndex, 1);
      }
    }
  });
  
  new Vue({
    el: '#app',
    data: {
      columns: [
        { name: 'Запланированные задачи', cards: [], isCollapsed: false },
        { name: 'Задачи в работе', cards: [], isCollapsed: false },
        { name: 'Тестирование', cards: [], isCollapsed: false },
        { name: 'Выполненные задачи', cards: [], isCollapsed: false }
    ],
      newCard: { title: '', description: '', deadline: '', priority: 1 }
    },
    computed: {
      isFormValid() {
        return this.newCard.title && this.newCard.description && this.newCard.deadline;
      },
      areAllCollapsed() {
        return this.columns.every(column => column.isCollapsed);
    },
    toggleColumn(columnIndex) {
      this.collapsedColumns[columnIndex] = !this.collapsedColumns[columnIndex];
  }
    },
    methods: {
      addCard(columnIndex) {
        if (columnIndex === 0 && this.isFormValid) {
          const newCard = {
              title: this.newCard.title,
              description: this.newCard.description,
              deadline: this.newCard.deadline,
              priority: Number(this.newCard.priority),
              dateCreated: new Date().toLocaleString(),
              lastEdited: new Date().toLocaleString()
          };
          this.columns[columnIndex].cards.push(newCard);
          this.sortCardsByPriority(columnIndex);
          this.clearNewCard();
      }
      },
      sortCardsByPriority(columnIndex) {
        this.columns[columnIndex].cards.sort((a, b) => a.priority - b.priority);
      },
      clearNewCard() {
        this.newCard = { title: '', description: '', deadline: '', priority: 1 };
      },
      deleteCard(columnIndex, cardIndex) {
        const confirmation = confirm('Вы действительно хотите удалить карту?');
        if (confirmation) {
          this.columns[columnIndex].cards.splice(cardIndex, 1);
        }
      },
      moveToInProgress(originalCard, columnIndex, cardIndex) {
        const inProgressIndex = 1;
        this.columns[inProgressIndex].cards.push({
          title: originalCard.title,
          description: originalCard.description,
          deadline: originalCard.deadline,
          priority: originalCard.priority,
          dateCreated: originalCard.dateCreated,
          lastEdited: originalCard.lastEdited
        });
        this.columns[columnIndex].cards.splice(cardIndex, 1);
        this.sortCardsByPriority(inProgressIndex);
      },
      moveToTesting(originalCard, columnIndex, cardIndex) {
        const testingIndex = 2;
        this.columns[testingIndex].cards.push({
          title: originalCard.title,
          description: originalCard.description,
          deadline: originalCard.deadline,
          priority: originalCard.priority,
          dateCreated: originalCard.dateCreated,
          lastEdited: originalCard.lastEdited
        });
        this.columns[columnIndex].cards.splice(cardIndex, 1);
        this.sortCardsByPriority(testingIndex);
      },
      moveToDone(originalCard, columnIndex, cardIndex) {
        const doneIndex = 3;
        const deadline = new Date(originalCard.deadline);
        const currentDate = new Date();
  
        if (currentDate > deadline) {
          originalCard.status = 'Overdue';
        } else {
          originalCard.status = 'Completed on time';
        }
  
        this.columns[doneIndex].cards.push({
          title: originalCard.title,
          description: originalCard.description,
          deadline: originalCard.deadline,
          priority: originalCard.priority,
          dateCreated: originalCard.dateCreated,
          lastEdited: originalCard.lastEdited,
          status: originalCard.status
        });
        this.columns[columnIndex].cards.splice(cardIndex, 1);
        this.sortCardsByPriority(doneIndex);
      },
      returnToInProgress(card, columnIndex, cardIndex) {
        const inProgressIndex = 1;
        this.columns[inProgressIndex].cards.push({
          title: card.title,
          description: card.description,
          deadline: card.deadline,
          priority: card.priority,
          dateCreated: card.dateCreated,
          lastEdited: card.lastEdited,
          returnReason: card.returnReason
        });
        this.columns[columnIndex].cards.splice(cardIndex, 1);
        this.sortCardsByPriority(inProgressIndex);
      },
      toggleColumn(index) {
        this.columns[index].isCollapsed = !this.columns[index].isCollapsed;
    },
    toggleAllColumns() {
        const shouldCollapse = !this.areAllCollapsed;
        this.columns.forEach(column => column.isCollapsed = shouldCollapse);
    },
    }
  });