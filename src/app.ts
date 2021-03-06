/* === Drag n Drop Interface Start */
/* DragEvent if built in object type from.. where I dont remember */
/* for draggable objects. 
to know to and fro */
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
  }
/* for objects where the draggable can be 
put into,
and dragged from
note dropHandler */  
interface DragTarget {
dragOverHandler(event: DragEvent): void;
dropHandler(event: DragEvent): void;
dragLeaveHandler(event: DragEvent): void;
}
/* === Drag n Drop Interface end */

/* ===Project Type Start */
/* this replaces the literal type */
enum ProjectStatus {
    Active,
    Finished
  }
  
  /* ? why not just use interface? */
  class Project {
    constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
    ) {}
  }
/* ===ProjectType end */



/* singleton class/ has a list of all the projects,
whether active or finished */
type Listener<T> = (items: T[]) => void;

/* ===State base class start */
class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>){
        this.listeners.push(listenerFn);
    }
}
/* ===State base class end */

/* ===ProjectState start */
class ProjectState extends State<Project> {
    protected listeners: Listener<Project>[] = [];
    private projects: Project[] = [];
    /* singleton >>> */
    private static instance: ProjectState;
  
    private constructor() {
        super();
    }
  
    static getInstance() {
      if (this.instance) {
        return this.instance;
      }
      this.instance = new ProjectState();
      return this.instance;
    }
    /* <<<singleton */
  
    addListener(listenerFn: Listener<Project> ){
      this.listeners.push(listenerFn);
    }
    
    private updateListener(){
        
      for (const listenerFn of this.listeners) {
          /* slice()  w/ no param will return a COPY of array */
        listenerFn(this.projects.slice());
      }
    }
  
    addProject(title: string, description: string, numOfPeople: number) {
        const newProject = new Project(
            Math.random().toString(),
            title,
            description,
            numOfPeople,
            ProjectStatus.Active
          );
        this.projects.push(newProject);
        this.updateListener();
    
    }
    /* change status of project when it moves between the two lists
    , or with the same box */
    moveProject(projectID: String, newStatus: ProjectStatus){
        /* find target projectItem from the entire list of projects */
        const project = this.projects.find(prj => prj.id === projectID);
        
        if(project
            && project.status !== newStatus){
            project.status = newStatus;
            this.updateListener();
        }
    }
  }
  
  const projectState = ProjectState.getInstance();
/* ===ProjectState end */


/* ===Validation start */
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}
/* validator
takes in a Validatable
returns boolean */
function validate(validatableInput: Validatable) {
    let isValid = true;
    /*  if required == true, 
    check that this input has a value */
    if (validatableInput.required) {
        console.log("dmdddo" + validatableInput.value.toString().trim().length);
        isValid = isValid && validatableInput.value.toString().trim().length !== 0;
    }
    /* checking for input length */
    if (validatableInput.minLength != null
        && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length > validatableInput.minLength;
    }
    if (validatableInput.maxLength != null
        && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length < validatableInput.maxLength;
    }
    /* checking for input value min/max */
    if (validatableInput.min != null 
        &&typeof validatableInput.value === 'number'
        ) {
        isValid  = isValid && validatableInput.value >= validatableInput.min;
      }
      if (validatableInput.max != null 
        && typeof validatableInput.value === 'number'
      ) {
        isValid = isValid && validatableInput.value <= validatableInput.max;
      }

    return isValid;
}
/* ===Validation end */


/* ===autobind decorator start */

/* decorator to use for some functions.
takes in 3 set-in-stone params,
returns a PropertyDescriptor ,
w/ target method bound to its intended object */
function autobind(
    _: any, 
    _2:string, 
    descriptor: PropertyDescriptor
    ){
    /* get original function */
    const originalMethod = descriptor.value;
    /* set modified PropertyDescriptor */
    const modiDescriptor: PropertyDescriptor ={
        /* ?? why this */
        configurable:true,
        /* a getter...
        ? is this called automatically? */
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return modiDescriptor;
    
}
/* ===autobind decorator end */

/* ===Component base start */
/* why the abstract? */
/* basically,
taking a template and attaching it to host
trying to use generic types, abstract class */
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;
  
    constructor(
      templateId: string,
      hostElementId: string,
      insertAtStart: boolean,
      newElementId?: string
    ) {
      this.templateElement = document.getElementById(
        templateId
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById(
          hostElementId)! as T;
  
      const importedNode = document.importNode(
        this.templateElement.content,
        true
      );
      this.element = importedNode.firstElementChild as U;
      if (newElementId) {
        this.element.id = newElementId;
      }
  
      this.attach(insertAtStart);
    }
  
    /* where to attach is unknown,
    so we take one more param */
    private attach(insertAtBeginning: boolean) {
      this.hostElement.insertAdjacentElement(
        insertAtBeginning ? 'afterbegin' : 'beforeend',
        this.element
      );
    }
  
    abstract configure(): void;
    abstract renderContent(): void;
  }
/* ===Component base end */

/* ===ProjectItem Class Start */
class ProjectItem extends Component<HTMLUListElement, HTMLElement> implements Draggable{
    private project: Project;

    /* 
    used for displaying content on html w/
    either people or person... not much functionality
    getter ... can be improved by me
    but trivial i think. */
    get persons() {
        if (this.project.people === 1) {
          return '1 person';
        } else {
          return `${this.project.people} persons`;
        }
      }


    constructor(
        hostID: string,
        project: Project
    ){
        super(
            "single-project",
            hostID,
            false,/* why false? => adding to end of list*/
            project.id
        );
        this.project = project;

        this.configure();
        this.renderContent();
    }
    /* methods from Draggable interface */
    @autobind
    dragStartHandler(event:DragEvent){
        /* dataTransfer is part of DragEvent type obj
        we set its data using another builtin function */
        event.dataTransfer!.setData("text/plain", this.project.id);
        /* set what kind of actions are allowed with this DragEvent */
        event.dataTransfer!.effectAllowed = "move";
    }
    dragEndHandler(_:DragEvent){
        console.log("DrageEnd");
    }
    /* MEthods from Componenet base class */
    /*  adds event listender, which is a builtin for HTMLElements type,
    for drag and drop */
    configure(){
        this.element.addEventListener(
            "dragstart", this.dragStartHandler
        );
        this.element.addEventListener(
            "dragend", this.dragEndHandler
        );
    }
    /* render content by adding them to HTMLElems */
    renderContent(){
        this.element.querySelector(
            "h2")!.textContent= this.project.title;
        this.element.querySelector(
        "h3")!.textContent = this.persons+` assigned`;
        this.element.querySelector(
            "p")!.textContent = this.project.description;
    }
}
/* ===ProjectItem Class end */


/* ===ProjectList Class Start */
class ProjectList extends Component <HTMLDivElement, HTMLElement> implements DragTarget{
    assignedProjects: Project[];
    /* extending a class, so most actions are done their.
    we just pass some params here to super() */
    constructor(private type:"active"|"finished"){
        super(
            "project-list", //template id
            "app", // host id
            false, // where to attach
            `${type}-projects` // if new elem, its id
            );
        this.assignedProjects = [];

        /* now render elem 
        attach is called at super()'s constructor*/
        this.configure()
        this.renderContent();
        
    } 
    /* DragTarget Handlers */
    @autobind
    dragOverHandler(event:DragEvent) {
        if (event.dataTransfer
            /* [0] has the types i guess..? dont know the internals of it */
            && event.dataTransfer.types[0] === "text/plain"){
            /* default js dont allow dropping, so call this before allowing it */
            event.preventDefault();

            const listEl = this.element.querySelector("ul")!;
            listEl.classList.add("droppable");
        }
        
    }
    @autobind
    dropHandler(event:DragEvent) {
        const prjId = event.dataTransfer!.getData("text/plain");
        projectState.moveProject(prjId, 
            this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished);
    }

    @autobind
    dragLeaveHandler(event:DragEvent) {
        const listEl = this.element.querySelector("ul")!;
        listEl.classList.remove("droppable");
    }

    /* in case of event, 
    configures projects to appropriate ul */
    configure(){
        /* drag drop listener add */
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        /* listen for state changes */
        projectState.addListener((projects:Project[]) => {
                const relevantProjects = projects.filter(prj => {
                        if (this.type === "active"){
                            return prj.status === ProjectStatus.Active;
                        }
                        return prj.status === ProjectStatus.Finished;
                    }
                );
                this.assignedProjects = relevantProjects;
                this.renderProjects();
            }
            
        );

    }
    renderContent() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul")!.id = listId;
        this.element.querySelector("h2")!.textContent 
            = this.type.toUpperCase() + " PROJECTS";
    }
    /* i guess umm....asdfasdf dk */
    private renderProjects() {
        /* get ul from html.
        possible since we added the id at
        ProjectList.renderContent() */
        const listEl = document.getElementById(
            `${this.type}-projects-list`)! as HTMLUListElement;
        /* band-aid solution for this project.
        should keep a note on which is already in list and not 
        for real projects*/
        listEl.innerHTML = "";
        /* for projects w/ changed stuff,
        create <li/>
        add textcontent,
        and add to <ul/> */
        for (const prjItem of this.assignedProjects) {
          
            const item = new ProjectItem(this.element.querySelector("ul")!.id, prjItem);


        }
      }


    
    
}
/* ===ProjectList Class end */


/*=== ProjectInput Class Start */
/* trying to access the `templates` in index.html.
?but why use class? */
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
    /* input handlers */
    titleInputHandler: HTMLInputElement;
    descInputHandler: HTMLInputElement;
    userNumHandler: HTMLInputElement;

    constructor(){
        super('project-input', 
        'app', 
        true, 
        'user-input'
        );
        /* most functionality movedto Component Class */

        /* assigning handlers its HTML elems */
        this.titleInputHandler = this.element.querySelector(
            "#title") as HTMLInputElement;
        // ??is this... hm.. input?
        this.descInputHandler = this.element.querySelector(
            "#description") as HTMLInputElement;
        this.userNumHandler = this.element.querySelector(
            "#people") as HTMLInputElement;
        // this.submitButtonHandler = this.elem.querySelector("")

        /* deals with submission 
        calls submitHandler function*/
        this.configure();

    }
    configure() {
        /* remember to bind */
        this.element.addEventListener("submit", this.submitHandler);
    }

    renderContent(){

    }
    /* gather and validate user input */
    private gatherUserInput(): [string, string, number] | void{
        /* get the values from class property */
        const enteredTitle = this.titleInputHandler.value;
        const enteredDescription = this.descInputHandler.value;
        const enteredPeople = this.userNumHandler.value;
        /* create Validatable type objects from obtained values */
        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
          };
          const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
          };
          const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 30
          };
          /* validate using validate() */
          /* if one of these fail, call alert() and return
          else, return the input in tuple form */
          if (
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
          ) {
            alert('dmddo, Invalid input, please try again!');
            return ;
          } else {
            return [enteredTitle, enteredDescription, +enteredPeople];
          }
    }
    /* clr */
    private clearInputs() {
        this.titleInputHandler.value = '';
        this.descInputHandler.value = '';
        this.userNumHandler.value = '';
      }

    /* ?why should decorator be one this function? */
    /* used at configure()
    takes in event,
    does stuff */
    @autobind
    private submitHandler(event: Event) {
        /* ?no idea what this does */
        event.preventDefault();
        /* parse userinput,
        create project
        add to list */
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)){
            const [title, desc, people] = userInput;
            projectState.addProject(title,desc,people);
            this.clearInputs()
        }
    }
    /* atach() moved to Component Class */
}


/* ===ProjectInput Class end */
const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");

/* ??how to add testing project by default? */
for (let i=0; i <5; i++){
    projectState.addProject("testing","testing descirption", i);
}


