import React, { Component } from "react";
import axios from "axios";
import Column from "./components/Column/";
import AddNewModal from "./components/AddNewModal/";
import Task from "./components/Task/";
import { fromJS } from "immutable";
import "./style.scss";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
// import uuidv1 from 'uuid/v1';
import { v1 as uuidv1 } from "uuid";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            news: [],
            displayModal: false,
            selectedColumn: "",
            taskContent: "",
            editedTaskIndex: null,
            editedTaskId: null,
            columns: fromJS([
                {
                    id: "td",
                    title: "TO DO",
                    tasks: [
                        { id: 1, content: "Demo task", time: "04/15/2019, 9:25:35 PM" },
                    ],
                },
                { id: "ip", title: "IN PROGRESS", tasks: [] },
                { id: "de", title: "DONE", tasks: [] },
            ]),
        };
    }

    componentDidMount() {
        axios
            .get("/api/news")
            .then((res) => {
                const news = res.data;
                this.setState({ news: news.news });
            })
            .catch((error) => console.log(error));

        const columns = localStorage.getItem("columns");
        if (columns) {
            this.setState({ columns: fromJS(JSON.parse(columns)) });
        }
    }

    handleToggleModal =
        (choosenColumn = "") =>
            () => {
                this.setState((prevState) => ({
                    displayModal: !prevState.displayModal,
                    selectedColumn: choosenColumn,
                }));
            };

    handleChangeTaskContent = (e) =>
        this.setState({ taskContent: e.target.value });

    handleChangeSelectedColumn = (selectedColumn) => () =>
        this.setState({ selectedColumn: selectedColumn });

    handleAddNewTask = () => {
        const { taskContent } = this.state;
        if (taskContent.trim() === "") {
            toastr.warning("Please enter your task", "Notice", { timeOut: 2000 });
        } else {
            const { selectedColumn, columns } = this.state;
            const newTask = fromJS({
                id: uuidv1(),
                content: taskContent,
                time: new Date().toLocaleString(),
            });
            const columnIndex = columns.findIndex(
                (column) => column.get("id") === selectedColumn
            );
            const updatedColumn = columns.updateIn([columnIndex, "tasks"], (tasks) =>
                tasks.push(newTask)
            );
            this.setState(
                {
                    displayModal: false,
                    selectedColumn: "",
                    taskContent: "",
                    columns: fromJS(updatedColumn),
                },
                () => {
                    localStorage.setItem("columns", JSON.stringify(updatedColumn.toJS()));
                }
            );
        }
    };

    handleDeleteTask = (columnIndex, taskIndex) => () => {
        const result = window.confirm("Are your sure to delete this task?");
        if (result) {
            const { columns } = this.state;
            const updatedColumn = columns.updateIn([columnIndex, "tasks"], (tasks) =>
                tasks.remove(taskIndex)
            );
            this.setState({ columns: fromJS(updatedColumn) }, () => {
                localStorage.setItem("columns", JSON.stringify(updatedColumn.toJS()));
                toastr.success("Delete task success", "Notice", { timeOut: 2000 });
            });
        }
    };

    handleChooseEditTask = (columnIndex, taskIndex) => () => {
        const selectedColumn = this.state.columns.getIn([columnIndex, "id"]);
        const task = this.state.columns.getIn([columnIndex, "tasks", taskIndex]);
        this.setState({
            selectedColumn,
            taskContent: task.get("content"),
            editedTaskIndex: taskIndex,
            editedTaskId: task.get("id"),
        });
    };

    handleEdit = () => {
        const { columns, selectedColumn, taskContent, editedTaskIndex } =
            this.state;
        const columnIndex = columns.findIndex(
            (column) => column.get("id") === selectedColumn
        );
        const updatedColumn = columns.updateIn([columnIndex, "tasks"], (tasks) =>
            tasks.setIn([editedTaskIndex, "content"], taskContent)
        );
        this.setState(
            {
                selectedColumn: "",
                taskContent: "",
                editedTaskId: null,
                editedTaskIndex: null,
                columns: fromJS(updatedColumn),
            },
            () => {
                localStorage.setItem("columns", JSON.stringify(updatedColumn.toJS()));
            }
        );
    };

    handleCancelEdit = () => {
        this.setState({
            selectedColumn: "",
            taskContent: "",
            editedTaskId: null,
            editedTaskIndex: null,
        });
    };

    handleSaveDrag = (result) => {
        const { source, destination, reason } = result;
        if (reason === "DROP" && destination) {
            const { columns } = this.state;
            const sourceColumnIndex = columns.findIndex(
                (column) => column.get("id") === source.droppableId
            );
            const task = columns.getIn([sourceColumnIndex, "tasks", source.index]);
            let updatedColumn = columns.updateIn(
                [sourceColumnIndex, "tasks"],
                (tasks) => tasks.remove(source.index)
            );
            const destinationColumnIndex = columns.findIndex(
                (column) => column.get("id") === destination.droppableId
            );
            updatedColumn = updatedColumn.updateIn(
                [destinationColumnIndex, "tasks"],
                (tasks) => tasks.insert(destination.index, task)
            );
            this.setState(
                {
                    columns: fromJS(updatedColumn),
                },
                () => {
                    localStorage.setItem("columns", JSON.stringify(updatedColumn.toJS()));
                }
            );
        }
    };

    render() {
        const { columns, selectedColumn, taskContent, displayModal, editedTaskId } =
            this.state;
        return (
            <div>
                        <h1 className="App__title">TO DO LIST</h1>
                        <DragDropContext onDragEnd={this.handleSaveDrag}>
                            <div className="App__content">
                                {columns.map((column, columnIndex) => (
                                    <Column
                                        key={column.get("id")}
                                        column={column}
                                        handleAddNewTask={this.handleToggleModal}
                                    >
                                        <Droppable droppableId={column.get("id")}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    style={{ minHeight: "300px" }}
                                                >
                                                 
                                                    {column.get("tasks").map((task, taskIndex) => (
                                                        <Task
                                                            key={task.get("id")}
                                                            index={taskIndex}
                                                            isEditing={task.get("id") === editedTaskId}
                                                            handleChangeTaskContent={
                                                                this.handleChangeTaskContent
                                                            }
                                                            task={task}
                                                            handleEdit={this.handleEdit}
                                                            handleCancelEdit={this.handleCancelEdit}
                                                            handleChooseEditTask={this.handleChooseEditTask(
                                                                columnIndex,
                                                                taskIndex
                                                            )}
                                                            handleDeleteTask={this.handleDeleteTask(
                                                                columnIndex,
                                                                taskIndex
                                                            )}
                                                        
                                            
                                                        />
                                                     
                                                    ))}
                                                       {/* {this.state.news.map((item) => (
                                                     <div key={item.id} class="Task">
                                                     <h2>{item.name}</h2>
                                                      <div>{item.description}</div>
                                                      </div>
                                                      ))} */}
                                                    {provided.placeholder}
                                                    {/* <div class="Task" data-rbd-draggable-context-id="1" data-rbd-draggable-id="2adbb210-01a7-11ec-b8f6-7bd1f2b309ac" tabindex="0" role="button" aria-describedby="rbd-hidden-text-1-hidden-text-1" data-rbd-drag-handle-draggable-id="2adbb210-01a7-11ec-b8f6-7bd1f2b309ac" data-rbd-drag-handle-context-id="1" draggable="false"><div class="Task__time"><i class="far fa-calendar-alt"></i> 8/20/2021, 6:10:03 PM</div><div class="Task__main"><div class="Task__content">dssd</div><div class="Task__action"><div class="Task__btn"><i class="far fa-edit"></i></div><div class="Task__btn"><i class="far fa-trash-alt"></i></div></div></div></div> */}
                                                </div>
                                            )}
                                        </Droppable>
                                    </Column>
                                ))}
                                 
                            </div>
                        </DragDropContext>
                        {displayModal && (
                            <AddNewModal
                                selectedColumn={selectedColumn}
                                taskContent={taskContent}
                                handleChangeTaskContent={this.handleChangeTaskContent}
                                handleChangeSelectedColumn={this.handleChangeSelectedColumn}
                                handleAddNewTask={this.handleAddNewTask}
                                handleToggleModal={this.handleToggleModal()}
                            />
                        )}

                <div></div>
            </div>
        );
    }
}

export default App;
