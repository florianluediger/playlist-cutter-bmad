import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  playlistName: string
  sourceCount: number
  excludeCount: number
}

interface SummaryBodyProps {
  playlistName: string
  sourceCount: number
  excludeCount: number
}

function SummaryBody({ playlistName, sourceCount, excludeCount }: SummaryBodyProps) {
  return (
    <div className="py-4 space-y-3">
      <p className="font-semibold text-base text-gray-900">{playlistName}</p>
      <dl className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <dt>Quellen</dt>
          <dd>{sourceCount} {sourceCount === 1 ? 'Playlist' : 'Playlisten'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Ausschlüsse</dt>
          <dd>{excludeCount} {excludeCount === 1 ? 'Playlist' : 'Playlisten'}</dd>
        </div>
      </dl>
    </div>
  )
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  playlistName,
  sourceCount,
  excludeCount,
}: ConfirmDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Playlist erstellen</DialogTitle>
            <DialogDescription>
              Überprüfe deine Auswahl, bevor die Playlist erstellt wird.
            </DialogDescription>
          </DialogHeader>
          <SummaryBody
            playlistName={playlistName}
            sourceCount={sourceCount}
            excludeCount={excludeCount}
          />
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
            <Button onClick={onConfirm} className="bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DrawerContent>
        <div className="p-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>Playlist erstellen</DrawerTitle>
            <DrawerDescription>
              Überprüfe deine Auswahl, bevor die Playlist erstellt wird.
            </DrawerDescription>
          </DrawerHeader>
          <SummaryBody
            playlistName={playlistName}
            sourceCount={sourceCount}
            excludeCount={excludeCount}
          />
          <DrawerFooter className="px-0 gap-2">
            <Button onClick={onConfirm} className="bg-sky-600 hover:bg-sky-700 text-white w-full">
              <Plus className="h-4 w-4 mr-2" />
              Erstellen
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Abbrechen</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
