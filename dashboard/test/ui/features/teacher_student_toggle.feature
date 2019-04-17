@eyes
@dashboard_db_access
Feature: Teacher Student Toggle

Scenario: Toggle on Multi Level
  When I open my eyes to test "toggle on multi level"
  Given I create an authorized teacher-associated student named "Daenerys"
  And I sign out
  Then I sign in as "Teacher_Daenerys"
  Then I am on "http://studio.code.org/s/allthethings/stage/9/puzzle/1"
  And I see no difference for "page load"
  Then I click selector ".show-handle .fa-chevron-left" once I see it
  Then I click selector ".uitest-viewAsStudent"
  And I see no difference for "view as student"
  Then I click selector ".uitest-viewAsTeacher"
  And I see no difference for "view as teacher"
  Then I open the progress drop down of the current page
  And I see no difference for "progress dropdown for teacher"

  And I click selector ".section-student .name a" to load a new page
  And I wait to see ".header_popup_link"
  Then I open the progress drop down of the current page
  And I wait until element ".user-stats-block:contains(Jigsaw)" is visible
  And I see no difference for "progress dropdown for teacher viewing as student"
  And I close my eyes

Scenario: Toggle on Hidden Maze Level
  When I open my eyes to test "toggle on hidden maze level"
  Given I create an authorized teacher-associated student named "Arya"
  And I sign out
  Then I sign in as "Teacher_Arya"
  Then I am on "http://studio.code.org/s/allthethings"
  And I select the first section
  And I wait to see ".uitest-togglehidden"
  Then I click selector ".uitest-togglehidden:nth(1) div:contains('Hidden')"
  Then I am on "http://studio.code.org/s/allthethings/stage/2/puzzle/1?noautoplay=true"
  And I wait for the page to fully load
  And I see no difference for "page load"
  Then I click selector ".show-handle .fa-chevron-left"
  Then I click selector ".uitest-viewAsStudent"
  And I see no difference for "view as student"
  Then I click selector ".uitest-viewAsTeacher"
  And I see no difference for "view as teacher"
  And I close my eyes

Scenario: Toggle on Lockable Level
  When I open my eyes to test "toggle on a lockable level"
  Given I create an authorized teacher-associated student named "Joffrey"
  And I sign out
  Then I sign in as "Teacher_Joffrey"

  Then I am on "http://studio.code.org/s/allthethings/lockable/1/puzzle/1/page/1?noautoplay=true"
  And I wait until element ".level-group" is visible
  And element "#locked-stage" is not visible
  And I see no difference for "page load"
  Then I click selector ".show-handle .fa-chevron-left"
  Then I click selector ".uitest-viewAsStudent"
  And I wait until element "#locked-stage" is visible
  And I see no difference for "view as student while locked"
  Then I click selector ".uitest-viewAsTeacher"
  And element "#locked-stage" is not visible
  And I see no difference for "view as teacher while locked"

  Then I am on "http://studio.code.org/s/allthethings"
  And I select the first section
  Then I open the stage lock dialog
  Then I unlock the stage for students

  Then I am on "http://studio.code.org/s/allthethings/lockable/1/puzzle/1/page/1?noautoplay=true"
  And I wait until element ".level-group" is visible
  And element "#locked-stage" is not visible
  Then I click selector ".show-handle .fa-chevron-left"
  Then I click selector ".uitest-viewAsStudent"
  And element "#locked-stage" is not visible
  And I see no difference for "view as student while unlocked"

  And I close my eyes
