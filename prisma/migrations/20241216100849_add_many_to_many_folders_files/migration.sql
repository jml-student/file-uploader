-- CreateTable
CREATE TABLE "Files" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "folder_id" INTEGER NOT NULL,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FolderFiles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FolderFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FolderFiles_B_index" ON "_FolderFiles"("B");

-- AddForeignKey
ALTER TABLE "_FolderFiles" ADD CONSTRAINT "_FolderFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "Files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderFiles" ADD CONSTRAINT "_FolderFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "Folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
