import * as React from 'react'

import {Block} from 'baseui/block'
import {motion, AnimatePresence} from 'framer-motion'

import * as QuestionnairesUtils from '../../../questionnaires-utils'
import * as ClientMemory from '../../../client-memory'
import {MainNavigation} from '../../../components/MainNavigation'
import {ShortAnswerResponding} from '../../../components/ShortAnswerResponding'
import {LongAnswerResponding} from '../../../components/LongAnswerResponding'
import {MultiChoiceResponding} from '../../../components/MultiChoiceResponding'
import {CheckboxesResponding} from '../../../components/CheckboxesResponding'
import {PrioritizationResponding} from '../../../components/PrioritizationResponding'
import {ActionsGroup} from '../../../components/ActionsGroup'

import {usePrevious} from '../../../hooks/usePrevious'
import {useResetMemory} from '../../../hooks/useResetMemory'

const RESPONDING_COMPONENTS = {
  SHORT_ANSWER: ShortAnswerResponding,
  MULTI_CHOICE: MultiChoiceResponding,
  CHECKBOXES: CheckboxesResponding,
  PRIORITIZATION: PrioritizationResponding,
  LONG_ANSWER: LongAnswerResponding,
}

const motionVariants = {
  enter: direction => {
    return {
      x: direction >= 0 ? 200 : -200,
      opacity: 0,
    }
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: direction => {
    return {
      zIndex: 0,
      x: direction > 0 ? -200 : 200,
      opacity: 0,
    }
  },
}

function Questionnaire({question}) {
  useResetMemory()

  const prevQuestionLinkIndex = usePrevious(question.linkIndex)

  const direction =
    prevQuestionLinkIndex !== undefined
      ? question.linkIndex - prevQuestionLinkIndex
      : 0

  const [isRespondingOk, setIsRespondingOk] = React.useState(false)
  const [isEditedRespondingOnceOnVisit, setIsEditedRespondingOnceOnVisit] =
    React.useState(false)

  const [registeredGroups, setRegisteredGroups] = React.useState(() => {
    return typeof window !== 'undefined'
      ? ClientMemory.getRegisteredGroups()
      : []
  })

  React.useEffect(
    function restoreStatesWhenQuestionChanged() {
      setIsEditedRespondingOnceOnVisit(false)
    },
    [question],
  )

  const handleOnRespondingValidate = isOk => {
    setIsRespondingOk(isOk)
  }

  const handleOnRespondingEdited = () => {
    setIsEditedRespondingOnceOnVisit(true)
  }

  const handleOnRegisteringNewGroups = newRegisteringGroups => {
    setRegisteredGroups(newRegisteringGroups)
  }

  const RespondingComp = RESPONDING_COMPONENTS[question.type]

  const sectionDisplayIndex =
    QuestionnairesUtils.getSectionDisplayIndexBySectionSlug(
      question.sectionSlug,
    )
  const title = `ตอนที่ ${sectionDisplayIndex}`

  return (
    <>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MainNavigation title={title} />
        <Block height={'48px'} />
        <section
          className="holy-grail-wrapper"
          style={{
            isolation: 'isolate',
            flex: '1',
          }}
        >
          <AnimatePresence exitBeforeEnter initial={false} custom={direction}>
            <motion.div
              key={question.id}
              custom={direction}
              variants={motionVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: {type: 'spring', stiffness: 300, damping: 30},
                opacity: {duration: 0.2},
              }}
            >
              <RespondingComp
                question={question}
                onValidate={handleOnRespondingValidate}
                onRegisteringGroups={handleOnRegisteringNewGroups}
                onEdited={handleOnRespondingEdited}
              />
            </motion.div>
          </AnimatePresence>
        </section>
        <Block height={'212px'} />
      </div>
      <ActionsGroup
        isRespondingOk={isRespondingOk}
        registeredGroups={registeredGroups}
        question={question}
        isEditedRespondingOnceOnVisit={isEditedRespondingOnceOnVisit}
      />
    </>
  )
}

export async function getStaticPaths() {
  const paths = QuestionnairesUtils.getAllQuestionsParams().map(
    questionParams => ({
      params: questionParams,
    }),
  )

  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({params}) {
  const thisQuestionParams = {
    sectionSlug: params.sectionSlug,
    questionIndex: params.questionIndex,
  }

  const allQuestionsParams = QuestionnairesUtils.getAllQuestionsParams()

  const allQuestionLinks = allQuestionsParams.map(
    QuestionnairesUtils.generateQuestionLink,
  )

  const thisRouteQuestionLink =
    QuestionnairesUtils.generateQuestionLink(thisQuestionParams)

  const thisQuestionLinkIndex = allQuestionLinks.indexOf(thisRouteQuestionLink)

  const nextQuestionLink = allQuestionLinks[thisQuestionLinkIndex + 1] ?? null
  const prevQuestionLink = allQuestionLinks[thisQuestionLinkIndex - 1] ?? null

  const thisQuestion =
    QuestionnairesUtils.getQuestionByQuestionParams(thisQuestionParams)

  const questionId = QuestionnairesUtils.generateQuestionId(thisQuestionParams)

  return {
    props: {
      question: {
        id: questionId,
        ...thisQuestionParams,
        ...thisQuestion,
        prevQuestionLink,
        nextQuestionLink,
        linkIndex: thisQuestionLinkIndex,
      },
    },
  }
}

export default Questionnaire
