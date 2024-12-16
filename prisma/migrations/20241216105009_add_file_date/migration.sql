/*
  Warnings:

  - You are about to drop the column `fileName` on the `Files` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Files` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Files` table. All the data in the column will be lost.
  - Added the required column `date` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Files" DROP COLUMN "fileName",
DROP COLUMN "filePath",
DROP COLUMN "fileSize",
ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;
