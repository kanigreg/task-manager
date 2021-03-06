import React, { useEffect, useState } from 'react';
import { propOr } from 'ramda';

import AddIcon from '@material-ui/icons/Add';
import Fab from '@material-ui/core/Fab';
import KanbanBoard from '@lourenci/react-kanban';

import '@lourenci/react-kanban/dist/styles.css';

import AddPopup from 'components/AddPopup';
import ColumnHeader from 'components/ColumnHeader';
import Task from 'components/Task';
import EditPopup from 'components/EditPopup';
import TaskForm from 'forms/TaskForm';
import TasksRepository from 'repositories/TasksRepository';

import TaskPresenter from 'utils/TaskPresenter';

import useStyles from './useStyles';

const STATES = [
  { key: 'new_task', value: 'New' },
  { key: 'in_development', value: 'In Dev' },
  { key: 'in_qa', value: 'In QA' },
  { key: 'in_code_review', value: 'in CR' },
  { key: 'ready_for_release', value: 'Ready for release' },
  { key: 'released', value: 'Released' },
  { key: 'archived', value: 'Archived' },
];

const MODES = {
  ADD: 'add',
  NONE: 'none',
  EDIT: 'edit',
};

const initialBoard = {
  columns: STATES.map((column) => ({
    id: column.key,
    title: column.value,
    cards: [],
    meta: {},
  })),
};

const TaskBoard = () => {
  const styles = useStyles();
  const [mode, setMode] = useState(MODES.NONE);
  const [board, setBoard] = useState(initialBoard);
  const [boardCards, setBoardCards] = useState({});
  const [openedTaskId, setOpenedTaskId] = useState(null);
  useEffect(() => loadBoard(), []);
  useEffect(() => generateBoard(), [boardCards]);

  const loadColumn = (state, page, perPage) => {
    return TasksRepository.index({
      q: { stateEq: state },
      page,
      perPage,
    });
  };

  const loadColumnInitial = (state, page = 1, perPage = 10) => {
    loadColumn(state, page, perPage).then(({ data }) => {
      setBoardCards((prevState) => {
        return {
          ...prevState,
          [state]: { cards: data.items, meta: data.meta },
        };
      });
    });
  };

  const generateBoard = () => {
    const newBoard = {
      columns: STATES.map(({ key, value }) => {
        return {
          id: key,
          title: value,
          cards: propOr({}, 'cards', boardCards[key]),
          meta: propOr({}, 'meta', boardCards[key]),
        };
      }),
    };

    setBoard(newBoard);
  };

  const loadBoard = () => {
    STATES.map(({ key }) => loadColumnInitial(key));
  };

  const loadColumnMore = (state, page = 1, perPage = 10) => {
    loadColumn(state, page, perPage).then(({ data }) => {
      setBoardCards((prevState) => {
        const updatedCards = [...prevState[state].cards, ...data.items];
        return {
          ...prevState,
          [state]: { cards: updatedCards, meta: data.meta },
        };
      });
    });
  };

  const handleCardDragEnd = (task, source, destination) => {
    const transition = task.transitions.find(({ to }) => destination.toColumnId === to);
    if (!transition) {
      return null;
    }

    return TasksRepository.update(task.id, { stateEvent: transition.event })
      .then(() => {
        loadColumnInitial(destination.toColumnId);
        loadColumnInitial(source.fromColumnId);
      })
      .catch((error) => {
        alert(`Move failed! ${error.message}`);
      });
  };

  const handleOpenAddPopup = () => {
    setMode(MODES.ADD);
  };

  const handleOpenEditPopup = (task) => {
    setOpenedTaskId(task.id);
    setMode(MODES.EDIT);
  };

  const handleClose = () => {
    setMode(MODES.NONE);
    setOpenedTaskId(null);
  };

  const handleTaskCreate = (params) => {
    const attributes = TaskForm.attributesToSubmit(params);
    return TasksRepository.create(attributes).then(({ data: { task } }) => {
      loadColumnInitial(TaskPresenter.state(task));
      handleClose();
    });
  };

  const loadTask = (id) => {
    return TasksRepository.show(id).then(({ data: { task } }) => task);
  };

  const handleTaskUpdate = (task) => {
    const attributes = TaskForm.attributesToSubmit(task);

    return TasksRepository.update(task.id, attributes).then(() => {
      loadColumnInitial(TaskPresenter.state(task));
      handleClose();
    });
  };

  const handleTaskDestroy = (task) => {
    return TasksRepository.destroy(task.id).then(() => {
      loadColumnInitial(TaskPresenter.state(task));
      handleClose();
    });
  };

  return (
    <>
      <Fab className={styles.addButton} color="primary" aria-label="add" onClick={handleOpenAddPopup}>
        <AddIcon />
      </Fab>
      <KanbanBoard
        renderCard={(card) => <Task onClick={handleOpenEditPopup} task={card} />}
        renderColumnHeader={(column) => <ColumnHeader column={column} onLoadMore={loadColumnMore} />}
        onCardDragEnd={handleCardDragEnd}
      >
        {board}
      </KanbanBoard>
      {mode === MODES.ADD && <AddPopup onCreateCard={handleTaskCreate} onClose={handleClose} />}
      {mode === MODES.EDIT && (
        <EditPopup
          onLoadCard={loadTask}
          onDestroyCard={handleTaskDestroy}
          onUpdateCard={handleTaskUpdate}
          onClose={handleClose}
          cardId={openedTaskId}
        />
      )}
    </>
  );
};

export default TaskBoard;
