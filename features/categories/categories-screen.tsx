"use client";

import { Button } from "@/components/base/buttons/button";
import { AlertDialog,Modal,ModalBody,ModalHeader } from "@/components/base/modal/modal";
import { Table,TableBody,TableCell,TableColumn,TableHeader,TableRow } from "@/components/base/table/table";
import { SearchField } from "@/components/base/search-field/search-field";
import { Spinner } from "@/components/base/spinner/spinner";
import { toast } from "@/components/base/toast/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { RiAddLine,RiFolderLine } from "@remixicon/react";
import { useState } from "react";
import CreateCategory from "./create-category";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { trackerApi } from "@/api/composition";
import type { Category } from "@/api/tracker";
import { apiErrorMessage } from "@/api/client";

const columns=[{id:"name",name:"Name"},{id:"description",name:"Description"},{id:"createdBy",name:"Created By"},{id:"createdAt",name:"Date Created"},{id:"actions",name:"Actions"}];

export default function CategoriesScreen(){
  const auth=useAuth();
  const cache=useQueryClient();
  const canView=auth.can("categories:view");
  const categories=useQuery({queryKey:["categories",auth.user?.id],queryFn:trackerApi.listCategories,enabled:canView});
  const [createOpen,setCreateOpen]=useState(false);
  const [editingCategory,setEditingCategory]=useState<Category|null>(null);
  const [deletingCategory,setDeletingCategory]=useState<Category|null>(null);
  const [deleteError,setDeleteError]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const isSupervisor=auth.user?.role.key==="supervisor"&&auth.user.role.type==="system";
  const canCreate=isSupervisor&&auth.can("categories:create");
  const canUpdate=isSupervisor&&auth.can("categories:update");
  const canDelete=isSupervisor&&auth.can("categories:delete");
  const visible=(categories.data??[]).filter(category=>`${category.name} ${category.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  function openCreate(){setEditingCategory(null);setCreateOpen(true);}
  function openEdit(category:Category){setEditingCategory(category);setCreateOpen(true);}
  function closeModal(){setCreateOpen(false);setEditingCategory(null);}
  async function handleDelete(category:Category){
    setDeleteError(null);
    try{
      await trackerApi.deleteCategory(category.id);
      await cache.invalidateQueries({queryKey:["categories"]});
      setDeletingCategory(null);toast.success("Category deleted successfully.");
    }catch(cause){const message=apiErrorMessage(cause,"Could not delete category.");setDeleteError(message);toast.error(message);throw cause;}
  }
  function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"—":date.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"Africa/Lagos"});}
  if(!canView)return <main className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-8"><h1 className="text-title-2-medium text-text-primary">Access restricted</h1><p className="text-body-regular text-text-secondary">Your role does not allow viewing categories.</p></main>;
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex flex-col gap-2"><h1 className="text-title-1-semibold text-text-primary">Categories</h1></div>{canCreate&&<Button leadingIcon={RiAddLine} className="h-11 rounded-xl" onClick={openCreate}>Add Category</Button>}</header>
    <SearchField aria-label="Search categories" placeholder="Search category name or description…" value={search} onChange={setSearch} className="max-w-xl"/>
    {categories.isPending?<div role="status" className="flex min-h-48 items-center justify-center gap-3 text-text-secondary"><Spinner/><span className="text-body-regular">Loading categories…</span></div>:categories.isError?<div role="alert" className="flex flex-col gap-4 rounded-3xl border border-border-button-default p-6"><p className="text-body-regular text-text-error-primary">{apiErrorMessage(categories.error,"Could not load categories.")}</p><Button variant="secondary" className="self-start" onClick={()=>void categories.refetch()}>Try again</Button></div>:<>
      <Table aria-label="Application categories" className="w-full [&_td]:px-4 [&_td]:py-5 [&_th]:px-4 [&_th]:py-4 [&_tr]:border-b [&_tr]:border-separator-border" containerClassName="rounded-2xl">
        <TableHeader>{columns.map(column=><TableColumn key={column.id} id={column.id} isRowHeader={column.id==="name"}>{column.name}</TableColumn>)}</TableHeader>
        <TableBody items={visible} renderEmptyState={()=><div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"><RiFolderLine className="size-8 text-foreground-icon-tertiary" aria-hidden/><p className="text-body-medium text-text-primary">No categories found</p>{canCreate&&!search&&<Button variant="secondary" leadingIcon={RiAddLine} onClick={openCreate}>Create category</Button>}</div>}>
          {category=><TableRow id={category.id} textValue={category.name}><TableCell><span className="text-body-medium text-text-primary"><bdi>{category.name}</bdi></span></TableCell><TableCell><p className="max-w-sm break-words text-body-2-regular text-text-secondary">{category.description||"—"}</p></TableCell><TableCell><span className="break-all text-caption-1-regular text-text-secondary" title={category.createdBy}>{category.createdBy===auth.user?.id?"You":category.createdBy}</span></TableCell><TableCell><span className="whitespace-nowrap text-body-2-regular text-text-secondary">{formatDate(category.createdAt)}</span></TableCell><TableCell>{canUpdate||canDelete?<div className="flex items-center gap-2">{canUpdate&&<Button variant="secondary" aria-label={`Edit ${category.name}`} onClick={()=>openEdit(category)}>Edit</Button>}{canDelete&&<Button variant="secondary" aria-label={`Delete ${category.name}`} onClick={()=>{setDeleteError(null);setDeletingCategory(category);}}>Delete</Button>}</div>:<span className="text-body-2-regular text-text-tertiary">Read only</span>}</TableCell></TableRow>}
        </TableBody>
      </Table><p className="text-caption-1-regular text-text-tertiary">{visible.length} {visible.length===1?"category":"categories"}{search?" match your search":" in this application"}.</p>
    </>}
    <Modal isOpen={createOpen} onOpenChange={open=>{if(!open)closeModal();else setCreateOpen(true);}} size="md" aria-label={editingCategory?"Edit category":"Create category"}><ModalHeader title={editingCategory?"Edit category":"Add a category"} /><ModalBody><CreateCategory key={editingCategory?.id??"new"} category={editingCategory} onCancel={closeModal} onSuccess={closeModal}/></ModalBody></Modal>
    <AlertDialog isOpen={!!deletingCategory} onOpenChange={open=>{if(!open){setDeletingCategory(null);setDeleteError(null);}}} title="Delete category?" description={`Delete “${deletingCategory?.name??""}”? `} confirmLabel="Delete category" pendingLabel="Deleting…" onConfirm={()=>deletingCategory?handleDelete(deletingCategory):Promise.resolve()}>{deleteError&&<p role="alert" className="text-body-2-regular text-text-error-primary">{deleteError}</p>}</AlertDialog>
  </main>;
}
