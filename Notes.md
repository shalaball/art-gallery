# Library view architecture
- visible from the website, but not in the navigation
- Holds all the photos
- listed in date order
- edit actions:
    - delete (to clear out old photos)
    - add to page

- the library view shows the photos in the library and only allows uploading of new photos and deletion. 
- the ability for the user to upload through the individual pages is still active.  
- Wherever the user uploads a picture it goes into the Libray.
- Buttons on each photo:

1. Delete.  First warns if it is in the Content.md file for a page.  If not, then the photo is deleted.  always ask user to confirm.

2. Add to page.  Shows a picklist of pages.  When chosen, system adds to the specified page.  Allow appearing on more than one page.
2a. Might it be more intuitive if the user could drag the photo to one of the pages in the left hand navigation?  Too complex.  Go with simple picklist.

# Page view options

- same as now with buttons for delete, rotate, and zoom. User can re-order by drag and drop. When user choses delete, however, the photo stays in the library and is only removed from the page.  

# Upload function.  
if the user uploads a duplicate, that's fine, but need to add a -n where n=2,3,4,5,... so filenames are unique.
