import { test } from '@playwright/test'
import { generateId, PlatformSetting, PlatformURI } from '../utils'
import { LeftSideMenuPage } from '../model/left-side-menu-page'
import { IssuesPage } from '../model/tracker/issues-page'
import { IssuesDetailsPage } from '../model/tracker/issues-details-page'
import { NewIssue } from '../model/tracker/types'
import { allure } from 'allure-playwright'
import { ContactsNavigationMenuPage } from '../model/contacts/navigation-menu-page'
import { EmployeesPage } from '../model/contacts/employees-page'
import { EmployeeDetailsPage } from '../model/contacts/employee-details-page'

test.use({
  storageState: PlatformSetting
})

test.describe('Mentions issue tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.parentSuite('Tracker tests')
    await (await page.goto(`${PlatformURI}/workbench/sanity-ws`))?.finished()
  })

  test('If user mentioned in the issue than he should be added as Collaborators', async ({ page }) => {
    const mentionIssue: NewIssue = {
      title: `Issue user mentioned as Collaborators-${generateId()}`,
      description: 'Issue user mentioned as Collaborators description'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(mentionIssue)
    await issuesPage.searchIssueByName(mentionIssue.title)
    await issuesPage.openIssueByName(mentionIssue.title)

    const issuesDetailsPage = new IssuesDetailsPage(page)
    await issuesDetailsPage.addMentions('Dirak Kainin')
    await issuesDetailsPage.checkCommentExist('@Dirak Kainin')

    await issuesDetailsPage.checkCollaborators(['Appleseed John'])
    // TODO bug with adding in collaborators
    // await issuesDetailsPage.checkCollaborators(['Appleseed John', 'Dirak Kainin'])
  })

  test('When Change assigner user should be added as Collaborators', async ({ page }) => {
    const mentionIssue: NewIssue = {
      title: `When Change assigner user should be added as Collaborators-${generateId()}`,
      description: 'When Change assigner user should be added as Collaborators description'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(mentionIssue)
    await issuesPage.searchIssueByName(mentionIssue.title)
    await issuesPage.openIssueByName(mentionIssue.title)

    const issuesDetailsPage = new IssuesDetailsPage(page)
    await issuesDetailsPage.editIssue({ assignee: 'Dirak Kainin' })
    await issuesDetailsPage.checkIssue({
      ...mentionIssue,
      assignee: 'Dirak Kainin'
    })
    await issuesDetailsPage.checkActivityExist('changed assignee')
    await issuesDetailsPage.checkActivityContentExist('Assignee set to Dirak Kainin')
    await issuesDetailsPage.checkCollaboratorsCount('2 members')
    await issuesDetailsPage.checkCollaborators(['Appleseed John', 'Dirak Kainin'])
  })

  test('Check that the backlink shown in the Contact activity', async ({ page }) => {
    const mentionName = 'Dirak Kainin'
    const mentionIssue: NewIssue = {
      title: `Check that the backlink shown in the Contact activity-${generateId()}`,
      description: 'Check that the backlink shown in the Contact activity description'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(mentionIssue)
    await issuesPage.searchIssueByName(mentionIssue.title)
    await issuesPage.openIssueByName(mentionIssue.title)

    const issuesDetailsPage = new IssuesDetailsPage(page)
    await issuesDetailsPage.addMentions(mentionName)
    await issuesDetailsPage.checkCommentExist(`@${mentionName}`)

    await leftSideMenuPage.buttonContacts.click()

    const contactsNavigationMenuPage = new ContactsNavigationMenuPage(page)
    await contactsNavigationMenuPage.buttonEmployee.click()

    const employeesPage = new EmployeesPage(page)
    await employeesPage.openEmployeeByName(mentionName)

    const employeeDetailsPage = new EmployeeDetailsPage(page)
    await employeeDetailsPage.checkActivityExist(`mentioned ${mentionName} in`, `@${mentionName}`)
  })
})
