from datetime import timezone, datetime

from background_task import background
from background_task.models import Task

from store_io.models import Sale


@background(schedule=10)
def remove_uncompleted_carts():
    uncompleted_carts = Sale.objects.filter(is_completed=False)
    for uc in uncompleted_carts:
        uc.delete()
