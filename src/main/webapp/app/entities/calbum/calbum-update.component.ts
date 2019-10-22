import { Component, OnInit } from '@angular/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HttpResponse, HttpErrorResponse } from '@angular/common/http';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
// import { filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { DATE_TIME_FORMAT } from 'app/shared/constants/input.constants';
import { JhiAlertService } from 'ng-jhipster';
import { ICalbum, Calbum } from 'app/shared/model/calbum.model';
import { CalbumService } from './calbum.service';
import { ICommunity } from 'app/shared/model/community.model';
import { CommunityService } from 'app/entities/community/community.service';
import { IAppuser } from 'app/shared/model/appuser.model';
import { AppuserService } from 'app/entities/appuser/appuser.service';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  selector: 'jhi-calbum-update',
  templateUrl: './calbum-update.component.html'
})
export class CalbumUpdateComponent implements OnInit {
  isSaving: boolean;

  communities: ICommunity[];
  calbum: ICalbum;
  appusers: IAppuser[];
  appuser: IAppuser;
  owner: any;
  isAdmin: boolean;
  creationDate: string;
  currentAccount: any;

  editForm = this.fb.group({
    id: [],
    creationDate: [null, [Validators.required]],
    title: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    communityId: [null, Validators.required]
  });

  constructor(
    protected jhiAlertService: JhiAlertService,
    protected calbumService: CalbumService,
    protected communityService: CommunityService,
    protected activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    protected appuserService: AppuserService,
    protected accountService: AccountService
  ) {}

  ngOnInit() {
    this.isSaving = false;
    this.activatedRoute.data.subscribe(({ calbum }) => {
      this.updateForm(calbum);
    });
    this.accountService.identity().subscribe(
      account => {
        this.currentAccount = account;
        this.isAdmin = this.accountService.hasAnyAuthority(['ROLE_ADMIN']);
        const query = {};
        if (this.currentAccount.id != null) {
          query['userId.equals'] = this.currentAccount.id;
        }
        this.appuserService.query(query).subscribe((res: HttpResponse<IAppuser[]>) => {
          this.owner = res.body[0].id;
          this.myCommunities();
          // this.loggedUser = res.body[0];
        });
      },
      (res: HttpErrorResponse) => this.onError(res.message)
    );
  }

  private myCommunities() {
    const query = {};
    if (this.currentAccount.id != null) {
      query['appuserId.equals'] = this.owner;
    }
    this.communityService.query(query).subscribe(
      (res: HttpResponse<ICommunity[]>) => {
        this.communities = res.body;
      },
      (res: HttpErrorResponse) => this.onError(res.message)
    );
  }

  updateForm(calbum: ICalbum) {
    this.editForm.patchValue({
      id: calbum.id,
      creationDate: calbum.creationDate != null ? calbum.creationDate.format(DATE_TIME_FORMAT) : null,
      title: calbum.title,
      communityId: calbum.communityId
    });
  }

  previousState() {
    window.history.back();
  }

  save() {
    this.isSaving = true;
    const calbum = this.createFromForm();
    if (calbum.id !== undefined) {
      this.subscribeToSaveResponse(this.calbumService.update(calbum));
    } else {
      this.subscribeToSaveResponse(this.calbumService.create(calbum));
    }
  }

  private createFromForm(): ICalbum {
    return {
      ...new Calbum(),
      id: this.editForm.get(['id']).value,
      creationDate:
        this.editForm.get(['creationDate']).value != null ? moment(this.editForm.get(['creationDate']).value, DATE_TIME_FORMAT) : undefined,
      title: this.editForm.get(['title']).value,
      communityId: this.editForm.get(['communityId']).value
    };
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICalbum>>) {
    result.subscribe(() => this.onSaveSuccess(), () => this.onSaveError());
  }

  protected onSaveSuccess() {
    this.isSaving = false;
    this.previousState();
  }

  protected onSaveError() {
    this.isSaving = false;
  }
  protected onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }

  trackCommunityById(index: number, item: ICommunity) {
    return item.id;
  }
}
