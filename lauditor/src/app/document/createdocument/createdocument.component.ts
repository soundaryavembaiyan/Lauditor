import { Component, Inject, Injectable, Input, Output, OnInit, EventEmitter, ViewChild, ElementRef, Renderer2, AfterViewInit, Optional } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ModalService } from 'src/app/model/model.service';
import { HttpService } from 'src/app/services/http.service';
import { URLUtils } from 'src/app/urlUtils';
import { DocumentService } from '../document.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import { error } from 'jquery';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/confirmation-dialog/confirmation-dialog.service';


@Component({
  selector: 'app-createdocument',
  templateUrl: './createdocument.component.html',
  styleUrls: ['./createdocument.component.scss']
})

@Injectable({
  providedIn: 'root',
})
export class CreateDocumentComponent {

  @ViewChild('content', { static: false })
  content!: ElementRef;
  @ViewChild('pdfContent') pdfContent!: ElementRef;

  product = environment.product;
  myForm: any;
  isDisabled: boolean = true;

  documentname: any;

  title: any;
  author: any;
  date: any;
  documents: any[] = [];

  overview: any;
  overviewTitle: any;
  isOverview: boolean = false;
  overviewDialog: boolean = true;

  section: any;
  sectionTitle: any;
  isSection: boolean = false;
  sectionDialog: boolean = true;

  subsection: any;
  subsectionTitle: any;
  issubSection: boolean = false;
  subsectionDialog: boolean = true;

  subsubsection: any;
  subsubsectionTitle: any;
  issubsubSection: boolean = false;
  subsubsectionDialog: boolean = true;

  paragraph: any;
  paragraphTitle: any;
  isParagraph: boolean = false;
  paragraphDialog: boolean = true;

  orderlist: any;
  orderlistTitle: any;
  isOrderlist: boolean = false;
  orderlistDialog: boolean = true;

  unorderlist: any;
  unorderlistTitle: any;
  isunOrderlist: boolean = false;
  unorderlistDialog: boolean = true;

  //orderListItems: string[] = [''];
  orderListItems: any;
  unorderListItems: any;

  overviewListItems:any;

  isPageBreak: boolean = false;
  pdfURL: any;
  pdfSrc: any;

  documentId: any;
  pageId: any;

  isSectionCompleted: boolean = false;
  selectedSection: string = '';

  receivedData: any;
  latexcode: any;
  docid: any;
  currentDocId: any;
  //overviews: { title: string, text: string }[] = [];
  overviewFields: any[] = [];
  latexdoc = environment.lateXAPI;
  submitted = false;
  documentIdo: any;


  constructor(private router: Router, private fb: FormBuilder, private httpservice: HttpService,
    private toast: ToastrService, private documentService: DocumentService, private cdr: ChangeDetectorRef,
    private renderer: Renderer2, private modalService: ModalService, private confirmationDialogService: ConfirmationDialogService,
    public sanitizer: DomSanitizer, public dialog: MatDialog) {

  }

  ngOnInit() {
    this.myForm = this.fb.group({

      title: ['', Validators.required],
      author: ['', Validators.required],
      date: [''],

      overview: ['', Validators.required],
      overviewTitle: ['', Validators.required],
      section: ['', Validators.required],
      sectionTitle: ['', Validators.required],
      subsection: ['', Validators.required],
      subsectionTitle: ['', Validators.required],
      subsubsection: ['', Validators.required],
      subsubsectionTitle: ['', Validators.required],
      paragraph: ['', Validators.required],
      paragraphTitle: ['', Validators.required],

      orderlist: ['', Validators.required],
      orderlistTitle: ['', Validators.required],
      orderListItems: this.fb.array([this.createorderItem()]),

      unorderlist: ['', Validators.required],
      unorderlistTitle: ['', Validators.required],
      unorderListItems: this.fb.array([this.createunorderItem()]),

    });

    this.orderListItems = this.myForm.get('orderListItems') as FormArray;
    this.unorderListItems = this.myForm.get('unorderListItems') as FormArray;

    //Get all Document
    this.httpservice.sendGetLatexDoc(URLUtils.getDocument).subscribe(
      (res: any) => {
        //this.documents = res;
        this.documents = res[0].documentname;
        console.log('this.documents', this.documents)
      }
    );
  }

  removeOverview(overview: any) {
    const index = this.overviewFields.indexOf(overview);
    if (index !== -1) {
      this.overviewFields.splice(index, 1);
    }
  }

  //Saveas dialog box!!
  downloadDialog() {
    const dialogRef = this.dialog.open(DownloadBoxComponent, {
      width: '500px',
      height: '200px',
      data: {
        //documentname: this.documentname,
        documentId: this.documentId
      }
    });

    dialogRef.afterClosed().subscribe((result: { docid: any, documentname: any }) => {
      if (result) {
        this.documentname = result.documentname;
        this.documentId = result.docid;
        //console.log('docname',this.documentname)
        this.httpservice.sendGetLatexDoc(URLUtils.savedDocid(this.documentId)).subscribe(
          (res: any) => {

          });
      }
    });
  }

  newDoc() {
    this.myForm.reset();
    this.isOverview = false;
    this.isSection = false;
    this.issubSection = false;
    this.issubsubSection = false;
    this.isParagraph = false;
    this.isOrderlist = false;
    this.isunOrderlist = false;
    this.isPageBreak = true;
    this.router.navigate(['/documents/create/client']);
  }

  onSubmit() {
    console.log('Form controls', this.myForm.value);
  }

  getDocument() {
    let req = { "documentname": this.myForm.value.title };
    //FIRST API
    this.httpservice.sendPostLatexRequest(URLUtils.savedoc, req).subscribe(
      (res: any) => {
        const documentId = res.id;
        this.documentId = documentId;
        //this.docidSave(documentId); //secondAPI methodcall
      }
    );
  }

  saveDoc() {
    const formValues = this.myForm.value;
    console.log('Form values:', formValues);

    //Form data controls
    const payload = {
      title: this.myForm.value.title,
      author: this.myForm.value.author,

      overview: this.myForm.value.overview,
      overviewTitle: this.myForm.value.overviewTitle,

      section: this.myForm.value.section,
      sectionTitle: this.myForm.value.sectionTitle,

      subsection: this.myForm.value.subsection,
      subsectionTitle: this.myForm.value.subsectionTitle,

      subsubsection: this.myForm.value.subsubsection,
      subsubsectionTitle: this.myForm.value.subsubsectionTitle,

      paragraph: this.myForm.value.paragraph,
      paragraphTitle: this.myForm.value.paragraphTitle,

      orderListItems: this.myForm.value.orderListItems,
      unorderListItems: this.myForm.value.unorderListItems,
    }
    console.log('PayloadForm Values:', payload);

    let title = this.myForm.value.title;
    let author = this.myForm.value.author;
    let currentDate = new Date().toDateString();
    let overview = this.myForm.value.overview || '';
    let overviewTitle = this.myForm.value.overviewTitle || '';
    let section = this.myForm.value.section || '';
    let sectionTitle = this.myForm.value.sectionTitle || '';
    let subsection = this.myForm.value.subsection || '';
    let subsectionTitle = this.myForm.value.subsectionTitle || '';
    let subsubsection = this.myForm.value.subsubsection || '';
    let subsubsectionTitle = this.myForm.value.subsubsectionTitle || '';
    let paragraph = this.myForm.value.paragraph || '';
    let paragraphTitle = this.myForm.value.paragraphTitle || '';
    let orderListItems = this.myForm.value.orderListItems;
    let unorderListItems = this.myForm.value.unorderListItems;
    let orderedList = orderListItems.map((item: any) => `\\item ${item.orderlist}`) || '';
    let unorderedList = unorderListItems.map((item: any) => `\\item ${item.unorderlist}`).join('\n');
    let latexDocument = `
  \\documentclass{article}
  \\usepackage{geometry}
  \\geometry{a4paper,total={170mm,257mm},left=20mm,top=20mm}
  
  \\title{${title}}
  \\author{${author}}
  \\date{${currentDate}}
  
  \\begin{document}
  \\maketitle

  \\begin{abstract}
  \\end{abstract}
  
  \\section*{${overviewTitle}}${overview}
  \\section*{${sectionTitle}}${section}
  \\subsection*{${subsectionTitle}}${subsection}
  \\subsubsection*{${subsubsectionTitle}}${subsubsection}
  \\paragraph*{${paragraphTitle}}${paragraph}
  
  \\begin{enumerate}
      ${orderedList} 
  \\end{enumerate}

  \\begin{itemize}
      ${unorderedList}
  \\end{itemize}
  
  \\end{document}`;
    let reqq = {
      "document": latexDocument,
      "page": 1
    };

    console.log('null:', this.documentId);
    if (this.documentId == null) {
    this.submitted = true;
    let req = { "documentname": this.myForm.value.title };
    //FIRST API
    this.httpservice.sendPostLatexRequest(URLUtils.savedoc, req).subscribe(
      (res: any) => {
        const documentId = res.id;
        this.documentId = documentId;
        console.log('DocID to saveas:', this.documentId);
        //SECONDAPI 
        this.httpservice.sendPostLatexRequest(URLUtils.savedocID(this.documentId), reqq).subscribe(
          (ress: any) => {
            this.pageId = ress.id;
            this.toast.success(ress.message)
          }
        );
      });
    }
      else{
          //THIRDAPI - for update
          this.httpservice.sendPatchLatexRequest(URLUtils.updateDoc(this.pageId), reqq).subscribe(
            (resp: any) => {
              this.toast.success(resp.message)
            });
      }
  }

  //Preview the PDF file
  getPreview() {
    if (this.documentId == '' || this.documentId == null) {
      this.submitted = true;
      this.toast.error("Please create & save the document") //If user clicks the previewIcon directly.
    }
    else {
      let url = this.latexdoc + URLUtils.getPreview(this.documentId)
      //console.log('ress:', url)
      this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  //ORDERED LIST ACTIONS
  addorderList(): void {
    this.orderListItems = this.myForm.get('orderListItems') as FormArray;
    this.orderListItems.push(this.createorderItem());
  }

  createorderItem(): FormGroup {
    return this.fb.group({
      orderlist: ['']
    });
  }

  removeorderList(i: number) {
    const orderListItemsArray = this.orderListItems as FormArray;
    orderListItemsArray.removeAt(i);
  }

  //UNORDERED LIST ACTIONS
  addunorderList(): void {
    this.unorderListItems = this.myForm.get('unorderListItems') as FormArray;
    this.unorderListItems.push(this.createunorderItem());
  }

  createunorderItem(): FormGroup {
    return this.fb.group({
      unorderlist: ['']
    });
  }

  removeunorderList(i: number) {
    const unorderListItemsArray = this.unorderListItems as FormArray;
    unorderListItemsArray.removeAt(i);
  }

  //PAGE BREAK FUNCTION
  insertPageBreak() {
    if (this.content && this.content.nativeElement) {
      const pageBreak = this.renderer.createElement('div');
      this.renderer.addClass(pageBreak, 'page-break');
      // visual representation of the page break
      this.renderer.setStyle(pageBreak, 'page-break-before', 'always');
      this.renderer.setStyle(pageBreak, 'border-top', '1px dashed #000');
      this.renderer.setStyle(pageBreak, 'margin-top', '20px'); // Adjust as needed
      this.renderer.appendChild(this.content.nativeElement, pageBreak);
    }
  }

  sectionOn() {
    this.isSection = true
    this.isSectionCompleted = true;
  }

  subsectionOn() {
    if (this.isSectionCompleted === true) {
      this.issubSection = true
    }
    else {
      this.toast.info("Please select the Section")
    }
  }

  subsubsectionOn() {
    if (this.isSectionCompleted === true) {
      this.issubsubSection = true
    }
    else {
      this.toast.info("Please select the Section")
    }
    //subsection2 was not directly allowed to select.
    if (this.isSectionCompleted && this.issubSection === false) {
      this.issubsubSection = false
      this.toast.info("Please select the Sub-Section 1")
    }
  }

  paragraphOn() {
    this.isParagraph = true
  }

  orderlistOn() {
    this.isOrderlist = true
  }

  unorderlistOn() {
    this.isunOrderlist = true
  }

  //Open document Dialog box!
  openDocumentDialog() {
    const dialogRef = this.dialog.open(OpendialogBoxComponent, {
      width: '500px',
      height: '500px',
      data: {
        title: this.title
      },
      //backdropClass: 'backdropBackground'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log("result after docClose:", result)
      if (result.docid) {
        this.openFile(result.docid)
      }
    });
  }

  //Open document Dialog to Template(data)
  openFile(docid: any) {
        
    this.isOverview = true; //this.isOverview = true && this.overview.length > 0;
    this.isSectionCompleted = true;
    this.isSection = true;
    this.issubSection = true;
    this.issubsubSection = true;
    this.isParagraph = true;
    this.isOrderlist = true;
    this.isunOrderlist = true;
    
    //Doc id
    this.documentId = docid;
    
    this.httpservice.sendGetLatexDoc(URLUtils.getDocument).subscribe(
      (res: any) => {
        this.documents = res;

        //OpenAPI 
        this.httpservice.sendGetLatexRequest(URLUtils.opendocID(docid)).subscribe(
          (req: any) => {
        
            this.latexcode = req[0];
            this.currentDocId = docid; //for Delete (docid)
            this.documentId = docid;
            console.log("req:", req);
            console.log("latexcode:", this.latexcode);
            
            // Extract Title
            const titleMatch = this.latexcode?.document.match(/\\title{([^}]*)}/);
            this.title = titleMatch && titleMatch.length > 1 ? titleMatch[1] : '';
            //console.log("Title:", this.title);

            // Extract Author
            const authorMatch = this.latexcode?.document.match(/\\author{([^}]*)}/);
            this.author = authorMatch && authorMatch.length > 1 ? authorMatch[1] : '';
            //console.log("Author:", this.author);

            // Extract Date
            // const dateMatch = this.latexcode?.document.match(/\\date{([^}]*)}/);
            // const date = dateMatch && dateMatch.length > 1 ? dateMatch[1] : '';
            // console.log("Date:", date);

            // Extract Abstract Title and Content
            this.overview = this.latexcode?.document.match(/\\abstract{([^}]*)}(.*?)\\section{/);
            this.overviewTitle = this.overview && this.overview.length > 1 ? this.overview[1] : '';
            this.overview = this.overview && this.overview.length > 2 ? this.overview[2] : '';
            this.overview = this.overview.replace(/<ltk>/g, '');
            // console.log("Overview Title:", this.overviewTitle);
            // console.log("Overview Content:", this.overview);
            // console.log("OverviewVal:", this.overview.length);

            // Extract Section Title and Content
            this.section = this.latexcode?.document.match(/\\section{([^}]*)}([^]*)\\subsection{/);
            this.sectionTitle = this.section && this.section.length > 1 ? this.section[1] : '';
            this.section = this.section && this.section.length > 2 ? this.section[2] : '';
            this.section = this.section.replace(/<ltk>/g, '');
            // console.log("sectionTitle:", this.sectionTitle);
            // console.log("section Content:", this.section);

            // Extract subSection Title and Content
            this.subsection = this.latexcode?.document.match(/\\subsection{([^}]*)}([^]*)\\subsubsection{/);
            this.subsectionTitle = this.subsection && this.subsection.length > 1 ? this.subsection[1] : '';
            this.subsection = this.subsection && this.subsection.length > 2 ? this.subsection[2] : '';
            this.subsection = this.subsection.replace(/<ltk>/g, '');
            // console.log("subsectionTitle:", this.subsectionTitle);
            // console.log("subsection Content:", this.subsection);

            // Extract subsubSection Title and Content
            this.subsubsection = this.latexcode?.document.match(/\\subsubsection{([^}]*)}([^]*)\\paragraph{/);
            this.subsubsectionTitle = this.subsubsection && this.subsubsection.length > 1 ? this.subsubsection[1] : '';
            this.subsubsection = this.subsubsection && this.subsubsection.length > 2 ? this.subsubsection[2] : '';
            this.subsubsection = this.subsubsection.replace(/<ltk>/g, '');
            // console.log("subsubsectionTitle:", this.subsubsectionTitle);
            // console.log("subsubsection Content:", this.subsubsection);

            // Extract Paragraph Title and Content
            this.paragraph = this.latexcode?.document.match(/\\paragraph{([^}]*)}([^\\]*)\\/);
            this.paragraphTitle = this.paragraph && this.paragraph.length > 1 ? this.paragraph[1] : '';
            this.paragraph = this.paragraph && this.paragraph.length > 2 ? this.paragraph[2] : '';
            this.paragraph = this.paragraph.replace(/<ltk>/g, '').trim();
            // console.log("paragraph Title:", this.paragraphTitle);
            // console.log("paragraph Content:", this.paragraph);

            // Extract Ordered List items
            const itemizeMatches = this.latexcode?.document.match(/\\begin{itemize}([^]*?)\\end{itemize}/);
            const itemizeContent = itemizeMatches && itemizeMatches.length > 0 ? itemizeMatches[1] : '';
            const itemizeList = itemizeContent.match(/\\item\s([^\\]*)/g);
            const itemizedItems = itemizeList ? itemizeList.map((match: string) => match.replace(/\\item\s/, '').trim()) : [];
            // console.log("Ordered List:", itemizedItems);
            this.updateOrderListItemsForm(itemizedItems); // Update the orderlist extracted data

            // Extract UnOrdered List items
            const enumerateMatches = this.latexcode?.document.match(/\\begin{enumerate}([^]*?)\\end{enumerate}/);
            const enumerateContent = enumerateMatches && enumerateMatches.length > 0 ? enumerateMatches[1] : '';
            const enumerateList = enumerateContent.match(/\\item\s([^\\]*)/g);
            const enumeratedItems = enumerateList ? enumerateList.map((match: string) => match.replace(/\\item\s/, '').trim()) : [];
            //console.log("Ordered List:", enumeratedItems);
            this.updateUnOrderListItemsForm(enumeratedItems); // Update the unorderlist extracted data
          }
        );
      }
    );


  }

  // Delete the open Document
  deleteDoc() {
    if (this.currentDocId) {
      this.confirmationDialogService.confirm('Confirmation', 'Are you sure you want to delete this Document?', true, 'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.httpservice.sendDeleteLatexRequest(URLUtils.deleteDocid(this.currentDocId)).subscribe((res: any) => {
              if (!res.error) {
                this.toast.success('Document deleted successfully')
                //this.confirmationDialogService.confirm('Success', 'Congratulations! You have successfully deleted the Document', false, 'Ok', 'Cancel', true);
                this.newDoc();
              }
            });
          }
        });
    }
  }
  //ORDERLIST EXTRACTION
  updateOrderListItemsForm(itemizedItems: string[]): void {
    // Clear existing items
    while (this.orderListItems.length !== 0) {
      this.orderListItems.removeAt(0);
    }
    // Add extracted items to the form array
    itemizedItems.forEach(item => {
      this.orderListItems.push(this.createorderItemWithValues(item));
    });
  }

  createorderItemWithValues(value: string): FormGroup {
    return this.fb.group({
      orderlist: [value] // Initialize with extracted value
    });
  }

  //UNORDERLIST EXTRACTION
  updateUnOrderListItemsForm(itemizedItems: string[]): void {
    // Clear existing items
    while (this.unorderListItems.length !== 0) {
      this.unorderListItems.removeAt(0);
    }
    // Add extracted items to the form array
    itemizedItems.forEach(item => {
      this.unorderListItems.push(this.createunorderItemWithValues(item));
    });
  }

  createunorderItemWithValues(value: string): FormGroup {
    return this.fb.group({
      unorderlist: [value] // Initialize with extracted value
    });
  }

  overviewOn() {
    this.isOverview = true;
    // this.overviewFields.push({});
    // this.overview.push(''); 
  }

  //Action dialog boxs!!
  openOverviewDialog() {
    this.overviewDialog = true;
    const dialogRef = this.dialog.open(DialogBoxComponent, {
      width: '600px',
      height: '330px',
      data: {
        overview: this.overview,
        overviewTitle: this.overviewTitle
      }
    });

    dialogRef.afterClosed().subscribe((result: { overview: string, overviewTitle: string }) => {
      if (result) {
        this.overview = result.overview;
        this.overviewTitle = result.overviewTitle;
      }
    });
  }

  openSectionDialog() {
    this.sectionDialog = true;
    const dialogRef = this.dialog.open(SectionBoxComponent, {
      width: '600px',
      height: '330px',
      data: {
        section: this.section,
        sectionTitle: this.sectionTitle
      }
    });

    dialogRef.afterClosed().subscribe((result: { section: string, sectionTitle: string }) => {
      if (result) {
        this.section = result.section;
        this.sectionTitle = result.sectionTitle;
      }
    });
  }

  opensubSectionDialog() {
    this.subsectionDialog = true;
    const dialogRef = this.dialog.open(SubSection1BoxComponent, {
      width: '600px',
      height: '330px',
      data: {
        subsection: this.subsection,
        subsectionTitle: this.subsectionTitle
      }
    });

    dialogRef.afterClosed().subscribe((result: { subsection: string, subsectionTitle: string }) => {
      if (result) {
        this.subsection = result.subsection;
        this.subsectionTitle = result.subsectionTitle;
      }
    });
  }

  opensubsubSectionDialog() {
    this.subsubsectionDialog = true;
    const dialogRef = this.dialog.open(SubSection2BoxComponent, {
      width: '600px',
      height: '330px',
      data: {
        subsubsection: this.subsubsection,
        subsubsectionTitle: this.subsubsectionTitle
      }
    });

    dialogRef.afterClosed().subscribe((result: { subsubsection: string, subsubsectionTitle: string }) => {
      if (result) {
        this.subsubsection = result.subsubsection;
        this.subsubsectionTitle = result.subsubsectionTitle;
      }
    });
  }

  openParagraphDialog() {
    this.paragraphDialog = true;
    const dialogRef = this.dialog.open(ParagraphBoxComponent, {
      width: '600px',
      height: '330px',
      data: {
        paragraph: this.paragraph,
        paragraphTitle: this.paragraphTitle
      }
    });

    dialogRef.afterClosed().subscribe((result: { paragraph: string, paragraphTitle: string }) => {
      if (result) {
        this.paragraph = result.paragraph;
        this.paragraphTitle = result.paragraphTitle;
      }
    });
  }

  openOrderlistDialog() {
    this.orderlistDialog = true;
    const dialogRef = this.dialog.open(OrderedlistBoxComponent, {
      width: '700px',
      height: '500px',
      data: {
        orderlist: this.orderlist,
        orderlistTitle: this.orderlistTitle,
        orderListItems: this.orderListItems
      }
    });
    //console.log('orderListItems',this.orderListItems)

    // dialogRef.afterClosed().subscribe((result: { orderlist: string, orderlistTitle: string, orderListItems: any }) => {
    //   if (result) {
    //     this.orderlist = result.orderlist;
    //     this.orderlistTitle = result.orderlistTitle;
    //     //this.orderListItems = result.orderListItems;
    //     this.orderListItems = this.fb.array(result.orderListItems);
    //   }
    // });

    dialogRef.afterClosed().subscribe((result: { orderlist: string, orderlistTitle: string, orderListItems: any }) => {
      if (result) {
        this.orderlist = result.orderlist;
        this.orderlistTitle = result.orderlistTitle;

        const formArrayControls = result.orderListItems.map((item: any) => this.fb.group({ orderlist: item.orderlist }));

        if (this.orderListItems) {
          this.orderListItems.clear(); // Clear existing items before pushing new ones
          formArrayControls.forEach((control: any) => {
            this.orderListItems.push(control); // Push each control to the FormArray
          });
        } else {
          this.orderListItems = this.fb.array(formArrayControls); // Initialize FormArray 
        }
      }
    });
  }

  openunOrderlistDialog() {
    this.unorderlistDialog = true;
    const dialogRef = this.dialog.open(UnorderedlistBoxComponent, {
      width: '700px',
      height: '500px',
      data: {
        unorderlist: this.unorderlist,
        unorderlistTitle: this.unorderlistTitle,
        unorderListItems: this.unorderListItems
      }
    });

    dialogRef.afterClosed().subscribe((result: { unorderlist: string, unorderlistTitle: string, unorderListItems: any }) => {
      if (result) {
        this.unorderlist = result.unorderlist;
        this.unorderlistTitle = result.unorderlistTitle;

        const formArrayControls = result.unorderListItems.map((item: any) => this.fb.group({ unorderlist: item.unorderlist }));

        if (this.unorderListItems) {
          this.unorderListItems.clear(); // Clear existing items before pushing new ones
          formArrayControls.forEach((control: any) => {
            this.unorderListItems.push(control); // Push each control to the FormArray
          });
        } else {
          this.unorderListItems = this.fb.array(formArrayControls); // Initialize FormArray 
        }
      }
    });
  }

  // hypenUpdate(newTitle: string) {
  //   if (newTitle && !newTitle.startsWith(' ')) {
  //     this.overviewTitle = '' + newTitle;
  //     this.sectionTitle = '' + newTitle;
  //   } else {
  //     this.overviewTitle = newTitle;
  //   }
  // }
}

@Component({
  selector: 'app-dialog-box',
  templateUrl: './dialog-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class DialogBoxComponent {
  dialog: any;
  name: any;
  overviewForm: any;

  overview: any;
  overviewTitle: any;
  isOverview: boolean = false;
  overviewDialog: boolean = true;

  //@Output() oversubmitted = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<DialogBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { overview: string, overviewTitle: string },
    private fb: FormBuilder) {
    this.overview = data.overview;
    this.overviewTitle = data.overviewTitle
  }

  ngOnInit() {

    this.overviewForm = this.fb.group({
      overviewTitle: ['', Validators.required],
      overview: ['', Validators.required],
    });
    //console.log('this.overview',this.overviewForm)

    if (this.overviewTitle && this.overviewTitle.startsWith('-')) {
      this.overviewTitle = this.overviewTitle.substring(2); // Remove the hyphen & space
    }

  }

  save() {
    // this.data.push({ data: this.overview });
    // this.dialogRef.close({data:this.overview});
    // this.overview = this.overview
    // console.log('saveData',this.data)
    // console.log('saveData1',this.data[1])
    // console.log('overview',this.overview)
    //this.dialogRef.close(this.overview);

    //for Hypen
    // if (this.overviewTitle && !this.overviewTitle.startsWith('-')) {
    //   this.overviewTitle = '- ' + this.overviewTitle;
    // }
    const data = {
      overview: this.overview,
      overviewTitle: this.overviewTitle
    };
    console.log('overview', this.overview)
    console.log('overviewTitle', this.overviewTitle)
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.overview = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.overviewTitle = '' + newTitle;
    }
  }

}


@Component({
  selector: 'app-section-box',
  templateUrl: './section-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class SectionBoxComponent {
  dialog: any;
  name: any;
  sectionForm: any

  section: any;
  sectionTitle: any;
  isSection: boolean = false;
  sectionDialog: boolean = true;

  //@Output() oversubmitted = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<SectionBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { section: string, sectionTitle: string },
    private fb: FormBuilder
  ) {
    //this.overview = data[0];
    this.section = data.section;
    this.sectionTitle = data.sectionTitle
  }

  ngOnInit() {

    this.sectionForm = this.fb.group({
      sectionTitle: ['', Validators.required],
      section: ['', Validators.required],
    });

    if (this.sectionTitle && this.sectionTitle.startsWith('-')) {
      this.sectionTitle = this.sectionTitle.substring(2); // Remove the hyphen & space
    }

  }

  save() {
    //for Hypen
    // if (this.sectionTitle && !this.sectionTitle.startsWith('-')) {
    //   this.sectionTitle = '- ' + this.sectionTitle;
    // }
    const data = {
      section: this.section,
      sectionTitle: this.sectionTitle
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.section = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.sectionTitle = '' + newTitle;
    }
  }

}

@Component({
  selector: 'app-subsection1-box',
  templateUrl: './subsection1-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class SubSection1BoxComponent {
  dialog: any;
  name: any;
  subsectionForm: any;

  subsection: any;
  subsectionTitle: any;
  issubSection: boolean = false;
  subsectionDialog: boolean = true;

  //@Output() oversubmitted = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<SubSection1BoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { subsection: string, subsectionTitle: string },
    private fb: FormBuilder
  ) {
    //this.overview = data[0];
    this.subsection = data.subsection;
    this.subsectionTitle = data.subsectionTitle
  }

  ngOnInit() {
    this.subsectionForm = this.fb.group({
      subsectionTitle: ['', Validators.required],
      subsection: ['', Validators.required],
    });

    if (this.subsectionTitle && this.subsectionTitle.startsWith('-')) {
      this.subsectionTitle = this.subsectionTitle.substring(2); // Remove the hyphen & space
    }

  }

  save() {
    //for Hypen
    // if (this.subsectionTitle && !this.subsectionTitle.startsWith('-')) {
    //   this.subsectionTitle = '- ' + this.subsectionTitle;
    // }
    const data = {
      subsection: this.subsection,
      subsectionTitle: this.subsectionTitle
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.subsection = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.subsectionTitle = '' + newTitle;
    }
  }

}

@Component({
  selector: 'app-subsection2-box',
  templateUrl: './subsection2-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class SubSection2BoxComponent {
  dialog: any;
  name: any;
  subsubsectionForm: any;

  subsubsection: any;
  subsubsectionTitle: any;
  issubsubSection: boolean = false;
  subsubsectionDialog: boolean = true;

  //@Output() oversubmitted = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<SubSection2BoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { subsubsection: string, subsubsectionTitle: string },
    private fb: FormBuilder
  ) {
    //this.overview = data[0];
    this.subsubsection = data.subsubsection;
    this.subsubsectionTitle = data.subsubsectionTitle
  }

  ngOnInit() {
    this.subsubsectionForm = this.fb.group({
      subsubsectionTitle: ['', Validators.required],
      subsubsection: ['', Validators.required],
    });

    if (this.subsubsectionTitle && this.subsubsectionTitle.startsWith('-')) {
      this.subsubsectionTitle = this.subsubsectionTitle.substring(2); // Remove the hyphen & space
    }

  }

  save() {
    //for Hypen
    // if (this.subsubsectionTitle && !this.subsubsectionTitle.startsWith('-')) {
    //   this.subsubsectionTitle = '- ' + this.subsubsectionTitle;
    // }
    const data = {
      subsubsection: this.subsubsection,
      subsubsectionTitle: this.subsubsectionTitle
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.subsubsection = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.subsubsectionTitle = '' + newTitle;
    }
  }

}


@Component({
  selector: 'app-paragraph-box',
  templateUrl: './paragraph-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class ParagraphBoxComponent {
  dialog: any;
  name: any;
  paragraphForm: any;

  paragraph: any;
  paragraphTitle: any;
  isParagraph: boolean = false;
  paragraphDialog: boolean = true;

  //@Output() oversubmitted = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<ParagraphBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { paragraph: string, paragraphTitle: string },
    private fb: FormBuilder
  ) {
    //this.overview = data[0];
    this.paragraph = data.paragraph;
    this.paragraphTitle = data.paragraphTitle
  }

  ngOnInit() {
    this.paragraphForm = this.fb.group({
      paragraphTitle: ['', Validators.required],
      paragraph: ['', Validators.required],
    });

    if (this.paragraphTitle && this.paragraphTitle.startsWith('-')) {
      this.paragraphTitle = this.paragraphTitle.substring(2); // Remove the hyphen & space
    }

  }

  save() {
    //for Hypen
    // if (this.paragraphTitle && !this.paragraphTitle.startsWith('-')) {
    //   this.paragraphTitle = '- ' + this.paragraphTitle;
    // }
    const data = {
      paragraph: this.paragraph,
      paragraphTitle: this.paragraphTitle
    };
    this.dialogRef.close(data);
    console.log('paraData', data)
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.paragraph = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.paragraphTitle = '' + newTitle;
    }
  }

}

@Component({
  selector: 'app-orderedlist-box',
  templateUrl: './orderedlist-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class OrderedlistBoxComponent {
  dialog: any;
  name: any;
  orderlistForm: any;

  orderlist: any;
  orderlistTitle: any;
  isOrderlist: boolean = false;
  orderlistDialog: boolean = true;

  @Input() orderListItems: FormArray;
  //orderListItems: string[] = [];
  childOrderListItems: any;

  constructor(
    public dialogRef: MatDialogRef<OrderedlistBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { orderlist: string, orderlistTitle: string, orderListItems: FormArray },
    private fb: FormBuilder
  ) {
    //this.overview = data[0];
    this.orderlist = data.orderlist;
    this.orderlistTitle = data.orderlistTitle;
    this.orderListItems = data.orderListItems;
  }


  ngOnInit() {
    this.orderlistForm = this.fb.group({
      orderlistTitle: ['', Validators.required],
      orderlist: ['', Validators.required],

      //orderListItems: this.fb.array([this.createItem()]),
      orderListItems: this.orderListItems

    });

    //this.orderListItems = this.orderlistForm.get('orderListItems') as FormArray;

    if (this.orderListItems) {
      this.orderListItems = this.fb.array([...this.orderListItems.controls]); // Make a copy of orderListItems
    } else {
      this.orderListItems = this.fb.array([]);
    }

    if (Array.isArray(this.data.orderListItems.controls)) {
      this.orderListItems = this.data.orderListItems as FormArray;
    } else {
      // If the data doesn't match the expected structure, create a new FormArray
      this.orderListItems = this.fb.array([]);
    }
    //console.log('OOOorderListItems',this.orderListItems)

    if (this.orderlistTitle && this.orderlistTitle.startsWith('-')) {
      this.orderlistTitle = this.orderlistTitle.substring(2); // Remove the hyphen & space
    }

  }


  addorderList(): void {
    this.orderListItems = this.orderlistForm.get('orderListItems') as FormArray;
    this.orderListItems.push(this.createunorderItem());
  }
  createunorderItem(): FormGroup {
    return this.fb.group({
      orderlist: [''] // Initialize with an empty value
    });
  }


  save() {
    //for Hypen
    // if (this.orderlistTitle && !this.orderlistTitle.startsWith('-')) {
    //   this.orderlistTitle = '- ' + this.orderlistTitle;
    // }

    const orderListItemsData = this.orderListItems.value;
    const data = {
      orderlist: this.orderlist,
      orderlistTitle: this.orderlistTitle,
      orderListItems: orderListItemsData
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.orderlist = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.orderlistTitle = '' + newTitle;
    }
  }

}

@Component({
  selector: 'app-unorderedlist-box',
  templateUrl: './unorderedlist-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class UnorderedlistBoxComponent {
  dialog: any;
  name: any;
  unorderlistForm: any;

  unorderlist: any;
  unorderlistTitle: any;
  isunOrderlist: boolean = false;
  unorderlistDialog: boolean = true;

  @Input() unorderListItems: FormArray;

  constructor(
    public dialogRef: MatDialogRef<UnorderedlistBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { unorderlist: string, unorderlistTitle: string, unorderListItems: FormArray },
    private fb: FormBuilder
  ) {
    this.unorderlist = data.unorderlist;
    this.unorderlistTitle = data.unorderlistTitle;
    this.unorderListItems = data.unorderListItems;
  }


  ngOnInit() {
    this.unorderlistForm = this.fb.group({
      orderlistTitle: ['', Validators.required],
      orderlist: ['', Validators.required],

      //orderListItems: this.fb.array([this.createItem()]),
      unorderListItems: this.unorderListItems

    });

    //this.orderListItems = this.orderlistForm.get('orderListItems') as FormArray;

    if (this.unorderListItems) {
      this.unorderListItems = this.fb.array([...this.unorderListItems.controls]); // Make a copy of orderListItems
    } else {
      this.unorderListItems = this.fb.array([]);
    }

    if (Array.isArray(this.data.unorderListItems.controls)) {
      this.unorderListItems = this.data.unorderListItems as FormArray;
    } else {
      // If the data doesn't match the expected structure, create a new FormArray
      this.unorderListItems = this.fb.array([]);
    }
    //console.log('OOOorderListItems',this.orderListItems)

    if (this.unorderlistTitle && this.unorderlistTitle.startsWith('-')) {
      this.unorderlistTitle = this.unorderlistTitle.substring(2); // Remove the hyphen & space
    }

  }


  addunorderList(): void {
    this.unorderListItems = this.unorderlistForm.get('unorderListItems') as FormArray;
    this.unorderListItems.push(this.createunorderItem());
  }
  createunorderItem(): FormGroup {
    return this.fb.group({
      unorderlist: [''] // Initialize with an empty value
    });
  }


  save() {
    //for Hypen
    // if (this.unorderlistTitle && !this.unorderlistTitle.startsWith('-')) {
    //   this.unorderlistTitle = '- ' + this.unorderlistTitle;
    // }

    const unorderListItemsData = this.unorderListItems.value;
    const data = {
      unorderlist: this.unorderlist,
      unorderlistTitle: this.unorderlistTitle,
      unorderListItems: unorderListItemsData
    };
    this.dialogRef.close(data);
  }

  closeDialog() {
    this.dialogRef.close()
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.unorderlist = target.value; // Overview to parent textarea
  }

  prependHyphen(newTitle: string) {
    if (newTitle && !newTitle.startsWith(' ')) {
      this.unorderlistTitle = '' + newTitle;
    }
  }

}


@Component({
  selector: 'app-opendialog-box',
  templateUrl: './opendialog-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class OpendialogBoxComponent {
  dialog: any;
  name: any;
  title: any;

  @Output() dataEvent: EventEmitter<any> = new EventEmitter<any>();
  //@Output() dataEvent: EventEmitter<{ title: string; author: string; }> = new EventEmitter<{ title: string; author: string; }>();

  @Input() documentname: string = '';
  documents: any = [];
  documentex: any = [];
  latexcode: any;
  pdfSrc: any;
  documentId: any;
  //document: any;
  selectedDocumentIndex = 0;
  searchText: any = '';
  targetDocId: any;
  sortKey: string = '';
  isReverse: boolean = false;

  constructor(
    @Optional() public dialogRef: MatDialogRef<OpendialogBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { title: string },
    private httpservice: HttpService, private toast: ToastrService, public sanitizer: DomSanitizer, private fb: FormBuilder) {

  }

  ngOnInit() {
    this.httpservice.sendGetLatexDoc(URLUtils.getDocument).subscribe(
      (res: any) => {
        this.documents = res;
      }
    );
  }

  //Function for truncate the texts
  truncateString(text: string): string {
    return text.slice(0, 18); // Get the first 15 characters
  }

  // openFile(docid:any) {
  //   //Get OpenAPI 
  //   this.httpservice.sendGetLatexDoc(URLUtils.getDocument).subscribe(
  //     (res: any) => {
  //       this.documents = res;
  //       //console.log('openDRes:', this.documents);

  //       this.httpservice.sendGetLatexRequest(URLUtils.opendocID(docid)).subscribe(
  //         (req: any) => {
  //           console.log('seldocId:', req);
  //           console.log('reqDocument:', document);

  //         }
  //       );
  //     }
  //   );


  //   //Dialog close
  //       this.dialogRef.afterClosed().subscribe((result: { title: string }) => {
  //         if (result) {
  //            this.title = result.title;  
  //            //console.log('title:', this.title);
  //         }
  //       });
  // }

  ondocumentClick(docid: any, docname: any) {
    this.dialogRef.close({ "docid": docid, "docname": docname })
  }
  openFile(docid: any) {
    //DocAPI 
    this.httpservice.sendGetLatexDoc(URLUtils.getDocument).subscribe(
      (res: any) => {
        this.documents = res;
        //console.log('openDRes:', this.documents);

        //OpenAPI 
        this.httpservice.sendGetLatexRequest(URLUtils.opendocID(docid)).subscribe(
          (req: any) => {

            this.latexcode = req[0];
            // this.dataEvent.emit(this.latexcode);
            // console.log('latexcode',this.latexcode?.document)

            // this.documentex = req;
            // console.log("documentex:", this.documentex);
            // const match = this.latexcode?.document.match(/<ltk>\\title{([^}]*)}<ltk>/)
            // console.log('mat',match)

            // // Extract Title
            // const titleMatch = this.latexcode?.document.match(/\\title{([^}]*)}/);
            // const title = titleMatch && titleMatch.length > 1 ? titleMatch[1] : '';
            // console.log("Title:", title);

            // // Extract Author
            // const authorMatch = this.latexcode?.document.match(/\\author{([^}]*)}/);
            // const author = authorMatch && authorMatch.length > 1 ? authorMatch[1] : '';
            // console.log("Author:", author);

            // // Extract Date
            // const dateMatch = this.latexcode?.document.match(/\\date{([^}]*)}/);
            // const date = dateMatch && dateMatch.length > 1 ? dateMatch[1] : '';
            // console.log("Date:", date);

            // // Extract Abstract Title and Content
            // const abstractMatch = this.latexcode?.document.match(/\\abstract{([^}]*)}([^]*)\\section{/);
            // const abstractTitle = abstractMatch && abstractMatch.length > 1 ? abstractMatch[1] : '';
            // console.log("Abstract Title:", abstractTitle);

            // const abstractContent = abstractMatch && abstractMatch.length > 2 ? abstractMatch[2] : '';
            // console.log("Abstract Content:", abstractContent);

            // // Extract Section Title and Content
            // const sectionMatch = this.latexcode?.document.match(/\\section{([^}]*)}([^]*)\\subsection{/);
            // const sectionTitle = sectionMatch && sectionMatch.length > 1 ? sectionMatch[1] : '';
            // console.log("sectionTitle:", sectionTitle);

            // const sectionContent = sectionMatch && sectionMatch.length > 2 ? sectionMatch[2] : '';
            // console.log("section Content:", sectionContent);

            // // Extract subSection Title and Content
            // const subsectionMatch = this.latexcode?.document.match(/\\subsection{([^}]*)}([^]*)\\subsubsection{/);
            // const subsectionTitle = subsectionMatch && subsectionMatch.length > 1 ? subsectionMatch[1] : '';
            // console.log("subsectionTitle:", subsectionTitle);

            // const subsectionContent = subsectionMatch && subsectionMatch.length > 2 ? subsectionMatch[2] : '';
            // console.log("subsection Content:", sectionContent);

            // // Extract subsubSection Title and Content
            // const subsubsectionMatch = this.latexcode?.document.match(/\\subsubsection{([^}]*)}([^]*)\\paragraph{/);
            // const subsubsectionTitle = subsubsectionMatch && subsubsectionMatch.length > 1 ? subsubsectionMatch[1] : '';
            // console.log("subsubsectionTitle:", subsubsectionTitle);

            // const subsubsectionContent = subsubsectionMatch && subsubsectionMatch.length > 2 ? subsubsectionMatch[2] : '';
            // console.log("subsubsection Content:", subsubsectionContent);

            // // Extract Paragraph Title and Content
            // const paragraphMatch = this.latexcode?.document.match(/\\paragraph{([^}]*)}([^]*)\\begin{/);
            // const paragraphTitle = paragraphMatch && paragraphMatch.length > 1 ? paragraphMatch[1] : '';
            // console.log("paragraph Title:", paragraphTitle);

            // const paragraphContent = paragraphMatch && paragraphMatch.length > 2 ? paragraphMatch[2] : '';
            // console.log("paragraph Content:", paragraphContent);

            // // Extract Itemized List Content
            // const itemizeMatches = this.latexcode?.document.match(/\\begin{itemize}([^]*)\\end{itemize}/);
            // const itemizeContent = itemizeMatches && itemizeMatches.length > 0 ? itemizeMatches[1] : '';
            // const itemizeList = itemizeContent.match(/\\item\s([^\\]*)/g);
            // const itemizedItems = itemizeList ? itemizeList.map((match: { match: (arg0: RegExp) => any[]; }) => match.match(/\\item\s([^\\]*)/)[1]) : [];
            // console.log("Itemized List Content:", itemizedItems);

            // // Extract Enumerated List Content
            // const enumerateMatches = this.latexcode?.document.match(/\\begin{enumerate}([^]*)\\end{enumerate}/);
            // const enumerateContent = enumerateMatches && enumerateMatches.length > 0 ? enumerateMatches[1] : '';
            // const enumerateList = enumerateContent.match(/\\item\s([^\\]*)/g);
            // const enumeratedItems = enumerateList ? enumerateList.map((match: { match: (arg0: RegExp) => any[]; }) => match.match(/\\item\s([^\\]*)/)[1]) : [];
            // console.log("Enumerated List Content:", enumeratedItems);

            // //Pass data from child to parent
            // this.dataEvent.emit(title);
            // console.log('childData:', title)

            // this.dialogRef.afterClosed().subscribe((result: { title: any }) => {
            //   if (result) {
            //     this.title = result.title;
            //     console.log('titleafterClosed:', this.title);
            //   }
            // });
          }
        );
      }
    );

    //Dialog close
    // this.dialogRef.afterClosed().subscribe((result: { title: string }) => {
    //   if (result) {
    //     this.title = result.title;
    //     console.log('titleafterClosed:', this.title);
    //   }
    // });
  }

  docidSave(documentId: any, document: any) {
    //Get OpenFileAPI 
    //console.log('OpendocumentId',documentId)
    this.httpservice.sendGetLatexRequest(URLUtils.opendocID(documentId)).subscribe(
      (res: any) => {
        console.log('resssss:', res);
        console.log('document:', document);
        //this.toast.success("Document opened successfully!")
      }
    );
  }

  sortingFile(val: any) {
    this.isReverse = !this.isReverse;
    if (this.isReverse) {
      this.documents = this.documents?.sort((p1: any, p2: any) => (p1[val] < p2[val]) ? 1 : (p1[val] > p2[val]) ? -1 : 0);

    } else {
      this.documents = this.documents?.sort((p1: any, p2: any) => (p1[val] > p2[val]) ? 1 : (p1[val] < p2[val]) ? -1 : 0);
    }
  }

  sortingDateFile(val: string) {
    if (this.sortKey === val) {
      this.isReverse = !this.isReverse;
    } else {
      this.sortKey = val;
      this.isReverse = false;
    }
    this.documents = this.documents?.sort((p1: any, p2: any) => {
      const date1 = new Date(p1.updatedon?.$date);
      const date2 = new Date(p2.updatedon?.$date);
      return this.isReverse ? date2.getTime() - date1.getTime() : date1.getTime() - date2.getTime();
    });
  }

  closeDialog() {
    this.dialogRef.close()
  }
}

@Component({
  selector: 'app-download-box',
  templateUrl: './download-box.component.html',
  styleUrls: ['./createdocument.component.scss'],
})

@Injectable()
export class DownloadBoxComponent {

  @Input() documentId: any;
  @Input() myForm: any;
  documentname: any;
  mydForm: any;

  constructor(
    public dialogRef: MatDialogRef<DownloadBoxComponent>, @Inject(MAT_DIALOG_DATA) public data: { documentname: string, documentId: any },
    private httpservice: HttpService, private toast: ToastrService, public sanitizer: DomSanitizer, private fb: FormBuilder) {
    this.documentname = data.documentname
    this.documentId = data.documentId

  }

  ngOnInit() {
    this.mydForm = this.fb.group({
      documentname: ['', Validators.required],
    });
  }

  downloadDoc() {
    if (this.documentId) {
      const reqq = { "documentname": this.mydForm.value.documentname };

      this.httpservice.sendPostLatexRequest(URLUtils.downloadDoc(this.documentId), reqq).subscribe(
        (res: any) => {
          this.toast.success(res.message);
          this.dialogRef.close({ "docid": res.id, "documentname": this.mydForm.value.documentname });
          // this.httpservice.sendGetLatexDoc(URLUtils.savedDocid(res.id)).subscribe(
          //   (res: any) => {
          //   });
        },
        (error: any) => {
          console.error('Error:', error);
        }
      );
    }
  }

  closeDialog() {
    this.dialogRef.close()
  }
}
